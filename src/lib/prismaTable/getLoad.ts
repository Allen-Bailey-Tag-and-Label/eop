import { prisma } from '$lib/prisma';
import type { Column, Field, PageServer } from './types';

type Paramaters = PageServer & {
	fields: Field[];
	fieldsRequiringRelation: Map<
		string,
		{
			key: string;
			model: string;
		}
	>;
	formulaColumns?: Map<string, Partial<Column> & { formula: (row: any) => any }>;
};

export const getLoad = async ({
	columnOmits,
	columnOrder,
	columnOverrides,
	fields,
	fieldsRequiringRelation,
	filters,
	formulaColumns,
	isCreatable,
	isDeletable,
	isEditable,
	isExportable,
	isFilterable,
	isSavable,
	modelName,
	paginate,
	relationLabelFns,
	sortDirection,
	sortKey
}: Paramaters) => {
	const getColumns = new Promise(async (resolve) => {
		const columns = [
			...(await Promise.all(
				fields
					.filter(
						({ name, relationName }: { name: string; relationName?: string }) =>
							name !== 'id' && relationName === undefined && !columnOmits?.includes(name)
					)
					.map(async ({ isList, name, type }: { isList: boolean; name: string; type: string }) => {
						const column: Column = Object.assign(
							{
								isCreatable: isCreatable === undefined ? true : isCreatable,
								isEditable: isEditable === undefined ? true : isEditable,
								isExportable: isExportable === undefined ? true : isExportable,
								isFilterable: isFilterable === undefined ? true : isFilterable,
								isList: false,
								isRelational: false,
								isVisible: true,
								key: name,
								label: name,
								relationOptions: [],
								type,
								width: 229
							},
							['createdAt', 'createdById', 'updatedAt'].includes(name) ? { isEditable: false } : {},
							['createdAt', 'updatedAt'].includes(name) ? { type: 'DateTimeLocal' } : {},
							columnOverrides !== undefined && columnOverrides.has(name)
								? columnOverrides.get(name)
								: {}
						);
						if (fieldsRequiringRelation.has(name)) {
							const { key: relationKey, model: relationModel } = fieldsRequiringRelation.get(
								name
							) || { key: '', model: '' };
							const relationLabelFn =
								relationLabelFns?.get(relationKey) ||
								((record) => {
									if (record?.label !== undefined) return record.label;
									if (record?.username !== undefined) return record.username;
									const [key] = Object.keys(record).filter((key) => key !== 'id');
									return record[key];
								});
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
			))
		];
		resolve(columns);
	});
	// @ts-ignore
	const getRows = <Record<string, any>[]>prisma[modelName].findMany();

	return {
		columnOrder: columnOrder || [],
		columns: getColumns,
		filters: filters || [],
		isCreatable: isCreatable === undefined ? true : isCreatable,
		isDeletable: isDeletable === undefined ? true : isDeletable,
		isEditable: isEditable === undefined ? true : isEditable,
		isFilterable: isFilterable === undefined ? true : isFilterable,
		isSavable: isSavable === undefined ? true : isSavable,
		paginate: paginate === undefined ? true : paginate,
		rows: getRows,
		sortDirection: sortDirection || 1,
		sortKey: sortKey || fields.filter(({ name }: { name: string }) => name !== 'id')[0].name
	};
};
