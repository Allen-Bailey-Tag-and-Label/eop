import { prisma } from '$lib/prisma';
import { getColumns } from './getColumns';
import type { GetColumnsOptions } from './types';

export const getLoadData = async (modelName: string, options: GetColumnsOptions = {}) => {
	const { columns, errors, findManyParamaters } = await getColumns(modelName, options);
	const rows = await prisma[modelName].findMany(findManyParamaters);
	return { columns, errors, model: modelName, rows };
};
