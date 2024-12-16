import { prisma } from '$lib/prisma';
import type { Column } from './types';

export const getLoad = async ({
	modelName,
	fields,
	fieldsRequiringRelation
}: {
	modelName: string;
	fields: any;
	fieldsRequiringRelation: any;
}) => {
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
						column.isList = isList;
						column.isRelational = true;
						column.relationKey = relationKey;
						column.relationOptions = [
							{ label: '', value: '' },
							// @ts-ignore
							...(await prisma[relationModel].findMany()).map(
								({ id, label }: { id: string; label: string }) => ({ label, value: id })
							)
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
