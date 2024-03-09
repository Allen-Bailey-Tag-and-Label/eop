import { prisma } from '$lib/prisma';
import { getColumns } from './getColumns';
import { mutateRows } from './mutateRows';
import type { ModelName, Options, OrderBy } from './types';

export const getLoadData = async (modelName: ModelName, options: Options = {}) => {
	try {
		const { columns, errors, include } = await getColumns(options);
		let orderBy = options?.orderBy || [];
		if (orderBy.length === 0) {
			const orderByColumn: OrderBy = {};
			orderByColumn[columns[0].key] = 'asc';
			orderBy = [orderByColumn];
		}
		const rows = await mutateRows(columns, await prisma[modelName].findMany({ include, orderBy }));
		return { dbTable: { columns, errors, model: modelName, orderBy, rows } };
	} catch (error) {
		console.log(error);
		return {
			dbTable: {
				columns: [],
				errors: [{ key: 'global', error }],
				model: modelName,
				orderBy: [],
				rows: []
			}
		};
	}
};
