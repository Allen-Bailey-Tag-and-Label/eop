import { fail, type Actions } from '@sveltejs/kit';
import { type Model } from 'mongoose';
import * as models from '$lib/server/mongoose/models';
import { Types } from 'mongoose';
import { sanitizeDataFromSchema } from './sanitizeDataFromSchema';

type ModelName = keyof typeof models;

const modelCache = new Map<ModelName, Model<any>>(
	Object.entries(models) as [ModelName, Model<any>][]
);

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const formData = Object.fromEntries(await request.formData());
		const { modelName, ...data } = formData as { modelName: ModelName } & Record<string, string>;

		const model = modelCache.get(modelName);
		if (!model) {
			return fail(400, { error: `Unknown model: ${modelName}` });
		}

		const sanitizedData = sanitizeDataFromSchema(model, data);

		const row = await model
			.create({ _createdById: new Types.ObjectId(locals.user._id), ...sanitizedData })
			.then((doc) => doc.toObject());

		return { row: JSON.parse(JSON.stringify(row)) };
	}
};
