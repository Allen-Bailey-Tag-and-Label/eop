import { prisma } from '$lib/prisma';
import type { Column, RelationLabelFns } from './types';

type Paramaters = {
	fields: any;
	fieldsRequiringRelation: any;
	modelName: string;
	relationLabelFns?: RelationLabelFns;
};

export const getLoad = async ({
	fields,
	fieldsRequiringRelation,
	modelName,
	relationLabelFns
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
								.sort((a: any, b: any) => a.label.localeCompare(b.label))
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
		columns: getColumns,
		rows: getRows
	};
};
