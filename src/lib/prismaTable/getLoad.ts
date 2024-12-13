import { prisma } from '$lib/prisma';
import { Prisma } from '@prisma/client';

export const getLoad = async (modelName: string) => {
	// @ts-ignore
	const getRows = <Record<string, any>[]>prisma[modelName].findMany();

	const fields =
		Prisma.dmmf.datamodel.models.find((model) => model.name === modelName)?.fields || [];
	const fieldNames = fields.map(({ name }) => name);

	return {
		columns: <
			((typeof fieldNames)[number] | { key: (typeof fieldNames)[number]; label?: string })[]
		>fieldNames.filter((fieldName) => fieldName !== 'id'),
		rows: getRows
	};
};
