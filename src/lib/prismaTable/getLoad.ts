import { prisma } from '$lib/prisma';
import type { Column, Paginate, RelationLabelFns } from './types';

type Paramaters = {
	columnOrder?: string[];
	fields: any;
	fieldsRequiringRelation: any;
	modelName: string;
	paginate?: boolean | Pick<Paginate, 'currentPage' | 'numberOfRowsPerPage'>;
	relationLabelFns?: RelationLabelFns;
	sortDirection?: -1 | 1;
	sortKey?: string;
};

export const getLoad = async ({
	columnOrder,
	fields,
	fieldsRequiringRelation,
	modelName,
	paginate,
	relationLabelFns,
	sortDirection,
	sortKey
}: Paramaters) => {
	const getColumns = new Promise(async (resolve) => {
		const columns = await Promise.all(
			fields
				.filter(
					({ name, relationName }: { name: string; relationName?: string }) =>
						name !== 'id' && relationName === undefined
				)
				.map(async ({ isList, name, type }: { isList: boolean; name: string; type: string }) => {
					const column: Column = {
						isList: false,
						isRelational: false,
						key: name,
						label: name,
						relationOptions: [],
						type,
						width: 229
					};
					if (fieldsRequiringRelation.has(name)) {
						const { key: relationKey, model: relationModel } = fieldsRequiringRelation.get(
							name
						) || { key: '', model: '' };
						const relationLabelFn =
							relationLabelFns?.get(relationKey) || ((record) => record.label);
						column.isList = isList;
						column.isRelational = true;
						column.label = relationKey;
						column.relationKey = relationKey;
						column.relationOptions = [
							{ label: '', value: '' },
							// @ts-ignore
							...(await prisma[relationModel].findMany())
								.map(({ id, ...record }: { id: string; record: Record<string, any> }) => ({
									label: relationLabelFn(record),
									value: id
								}))
								.sort((a: any, b: any) => a?.label?.localeCompare?.(b?.label) || 0)
						];
					}
					return column;
				})
		);
		resolve(columns);
	});
	// @ts-ignore
	const getRows = <Record<string, any>[]>prisma[modelName].findMany();

	return {
		columnOrder,
		columns: getColumns,
		paginate: paginate === undefined ? true : paginate,
		rows: getRows,
		sortDirection: sortDirection || 1,
		sortKey: sortKey || fields.filter(({ name }: { name: string }) => name !== 'id')[0].name
	};
};
