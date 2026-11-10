import { Types, type PipelineStage } from 'mongoose';
import type { ServerLoadEvent } from '@sveltejs/kit';
import { ShippingQuote } from '../mongoose/models/ShippingQuote';
import { UpsQuote } from '../mongoose/models/UpsQuote';
import { Branch } from '../mongoose/models/Branch';
import { User } from '../mongoose/models/User';
import { connect } from '../mongoose/connect';
import { getSettings } from '../mongoose/getSettings';
import { getColumns } from '../mongoose/getColumns';
import { applyColumnsOrder } from '../mongoose/applyColumnsOrder';
import { filtersToMongoQuery } from '../mongoose/filtersToMongoQuery';
import { shippingFinderColumns } from '$lib/shipping/finder';

const legacyText = (input: string) => ({
	$convert: { input, to: 'string', onError: '', onNull: '' }
});
const legacyDate = (input: unknown) => ({
	$convert: { input, to: 'date', onError: null, onNull: null }
});

export function shippingFinderPipeline(): PipelineStage[] {
	return [
		{
			$project: {
				number: 1,
				_branchId: 1,
				_createdById: 1,
				createdAt: 1,
				updatedAt: 1,
				request: 1,
				origin: { $literal: 'shipping' }
			}
		},
		{
			$unionWith: {
				coll: UpsQuote.collection.name,
				pipeline: [
					{
						$project: {
							number: { $toString: '$quote' },
							_branchId: 1,
							_createdById: 1,
							createdAt: legacyDate({ $ifNull: ['$createdAt', '$date'] }),
							updatedAt: legacyDate({ $ifNull: ['$updatedAt', '$createdAt'] }),
							origin: { $literal: 'legacy-ups' },
							isValidated: 1,
							packageTotalCount: 1,
							packageTotalWeight: 1,
							request: {
								services: { $literal: 'UPS' },
								customer: { $literal: '' },
								reference: { $literal: '' },
								shipTo: {
									address: {
										$cond: [
											{ $isArray: '$shipTo.AddressLine' },
											{
												$reduce: {
													input: '$shipTo.AddressLine',
													initialValue: '',
													in: {
														$concat: [
															'$$value',
															{ $cond: [{ $eq: ['$$value', ''] }, '', ', '] },
															legacyText('$$this')
														]
													}
												}
											},
											legacyText('$shipTo.AddressLine')
										]
									},
									city: legacyText('$shipTo.City'),
									state: legacyText('$shipTo.StateProvinceCode'),
									zip: legacyText('$shipTo.PostalCode')
								}
							}
						}
					}
				]
			}
		}
	];
}

// Use the same table data/settings contract as serverLoad, with a union before filtering/counting.
export async function loadShippingQuoteFinder({
	locals,
	url
}: Pick<ServerLoadEvent, 'locals' | 'url'>) {
	await connect();
	const [baseColumns, settings] = await Promise.all([
		getColumns({
			model: ShippingQuote,
			omitColumns: ['_id', 'requestKey', 'request', 'rates', 'attempts'],
			labelFunctionMap: new Map([['Branch', (doc) => `${doc.number}`]])
		}),
		getSettings({ locals, url })
	]);
	const columns = applyColumnsOrder(
		[...baseColumns, ...shippingFinderColumns],
		settings.columnsOrder
	);
	const keys = new Set(columns.map((column) => (typeof column === 'string' ? column : column.key)));
	if (!keys.has(settings.sortKey)) settings.sortKey = 'createdAt';
	settings.currentPage = Math.max(0, Math.floor(settings.currentPage) || 0);
	settings.rowsPerPage = Math.max(1, Math.min(1000, Math.floor(settings.rowsPerPage) || 10));
	const filters = (Array.isArray(settings.filter) ? settings.filter : [])
		.filter((filter) => keys.has(filter.key))
		.map((filter) => {
			const cast = (value: unknown) => {
				if (
					(filter.key === '_branchId' || filter.key === '_createdById') &&
					typeof value === 'string' &&
					/^[a-f\d]{24}$/i.test(value)
				)
					return new Types.ObjectId(value);
				if (
					(filter.key === 'createdAt' || filter.key === 'updatedAt') &&
					typeof value === 'string' &&
					Number.isFinite(Date.parse(value))
				)
					return new Date(value);
				return value;
			};
			return {
				...filter,
				value: Array.isArray(filter.value) ? filter.value.map(cast) : cast(filter.value)
			};
		});
	const direction = settings.sortDirection === 'desc' ? -1 : 1;
	const reference =
		settings.sortKey === '_branchId'
			? { model: Branch, label: 'number' }
			: settings.sortKey === '_createdById'
				? { model: User, label: 'username' }
				: null;
	const sort: PipelineStage.FacetPipelineStage[] = reference
		? [
				{
					$lookup: {
						from: reference.model.collection.name,
						localField: settings.sortKey,
						foreignField: '_id',
						as: '__finderRef'
					}
				},
				{
					$set: {
						__finderLabel: {
							$convert: {
								input: { $arrayElemAt: [`$__finderRef.${reference.label}`, 0] },
								to: 'string',
								onNull: '',
								onError: ''
							}
						}
					}
				},
				{ $sort: { __finderLabel: direction, _id: direction } },
				{ $unset: ['__finderRef', '__finderLabel'] }
			]
		: [{ $sort: { [settings.sortKey]: direction, _id: direction } }];
	const result = ShippingQuote.aggregate<{
		rows: Record<string, unknown>[];
		count: { total: number }[];
	}>([
		...shippingFinderPipeline(),
		{ $match: filtersToMongoQuery(filters) },
		{
			$facet: {
				rows: [
					...sort,
					...(settings.isPaginateable
						? [
								{ $skip: settings.currentPage * settings.rowsPerPage },
								{ $limit: settings.rowsPerPage }
							]
						: [])
				],
				count: [{ $count: 'total' }]
			}
		}
	]).then((results) => ({
		rows: JSON.parse(JSON.stringify(results[0]?.rows ?? [])) as Record<string, unknown>[],
		total: results[0]?.count[0]?.total ?? 0
	}));
	return {
		columns,
		settings,
		rows: result.then((value) => value.rows),
		totalRows: result.then((value) => value.total)
	};
}
