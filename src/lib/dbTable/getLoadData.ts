import { prisma } from '$lib/prisma';
import { getColumns } from './getColumns';
import { mutateRows } from './mutateRows';
import type { GetColumnsOptions } from './types';

export const getLoadData = async (modelName: string, options: GetColumnsOptions = {}) => {
	const defaultOptions = {
		columnOverrides: new Map(),
		fieldFilterNames: [],
		findManyParamaters: {
			include: {},
			orderBy: []
		}
	};
	options = Object.assign(defaultOptions, options);
	try {
		const { columns, errors, include } = await getColumns(modelName, options);
		let { orderBy } = options?.findManyParamaters || { orderBy: [] };
		if (orderBy.length === 0) {
			const orderByColumn: { [key: string]: 'asc' | 'desc' } = {};
			orderByColumn[columns[0].key] = 'asc';
			orderBy = [orderByColumn];
		}
		const rows = await mutateRows(columns, await prisma[modelName].findMany({ include, orderBy }));
		return { columns, errors, model: modelName, orderBy, rows };
	} catch (error) {
		return {
			columns: [],
			errors: [{ key: 'global', error }],
			model: modelName,
			orderBy: [],
			rows: []
		};
	}
};
