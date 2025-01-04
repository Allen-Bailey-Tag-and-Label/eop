import { prisma } from '$lib';
import { getModelNames } from '$lib/prismaTable';
import type { Actions } from '@sveltejs/kit';

type Args = {} | Create | CreateMany;
type Create = {
	data: Data;
};
type CreateMany = {
	data: Data[];
};
type Data = Record<string, any>;

export const actions: Actions = {
	default: async ({ request }) => {
		const { modelName, operation, where, data, update, create } = <Record<string, string>>(
			Object.fromEntries(await request.formData())
		);

		let args: Args = {};

		if (['create', 'createMany', 'createManyAndReturn'].includes(operation))
			args = { data: JSON.parse(data === '' ? JSON.stringify({}) : data) };
		if (['delete', 'deleteMany', 'findFirst', 'findMany', 'findUnique'].includes(operation))
			args = { where: JSON.parse(where === '' ? JSON.stringify({}) : where) };
		if (['update', 'updateMany'].includes(operation))
			args = {
				where: JSON.parse(where === '' ? JSON.stringify({}) : where),
				data: JSON.parse(data === '' ? JSON.stringify({}) : data)
			};
		if (['upsert'].includes(operation))
			args = {
				where: JSON.parse(where === '' ? JSON.stringify({}) : where),
				update: JSON.parse(update === '' ? JSON.stringify({}) : update),
				create: JSON.parse(create === '' ? JSON.stringify({}) : create)
			};

		// @ts-ignore
		const result = await prisma[modelName][operation](args);

		return { result, success: true };
	}
};
export const load = async () => {
	const modelNames = getModelNames();
	return {
		modelNames
	};
};
