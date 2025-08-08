import { fail, type Actions } from '@sveltejs/kit';
import { type Model, Types } from 'mongoose';
import * as models from '$lib/server/mongoose/models';
import { sanitizeDataFromSchema } from './sanitizeDataFromSchema';
import type { ObjectId } from 'mongodb';

type ModelName = keyof typeof models;

const modelCache = new Map<ModelName, Model<any>>(
	Object.entries(models) as [ModelName, Model<any>][]
);

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const formData = Object.fromEntries(await request.formData());
		const { modelName, ...data } = formData as { modelName: ModelName } & Record<string, string>;

		const model = modelCache.get(modelName);
		if (!model) return fail(400, { error: `Unknown model: ${modelName}` });

		const sanitizedData = sanitizeDataFromSchema(model, data);

		const row = await model
			.create({ _createdById: new Types.ObjectId(locals.user._id), ...sanitizedData })
			.then((doc) => doc.toObject());

		return { row: JSON.parse(JSON.stringify(row)) };
	},
	delete: async ({ locals, request }) => {
		const formData = await request.formData();

		const modelName = formData.get('modelName') as ModelName;
		if (!modelName) return fail(400, { error: 'Missing modelName' });

		const model = modelCache.get(modelName);
		if (!model) return fail(400, { error: `Model "${modelName}" doesn't exist` });

		const _ids: ObjectId[] = [];

		for (const [key, value] of formData.entries()) {
			if (key === 'modelName') continue;

			if (key === '_id') _ids.push(new Types.ObjectId(value as string));
		}

		await model
			.deleteMany(
				{ _id: { $in: _ids } },
				{
					_createdById: new Types.ObjectId(locals.user._id),
					context: 'query',
					new: true
				}
			)
			.lean();

		return {};
	},
	find: async ({ locals, request }) => {
		const { _routeId, currentPage, filter, rowsPerPage, sortDirection, sortKey } = <
			Record<string, string>
		>Object.fromEntries(await request.formData());
		const update = {
			_routeId,
			_userId: locals.user._id,
			currentPage: +currentPage,
			filter: JSON.parse(filter),
			rowsPerPage: +rowsPerPage,
			sortDirection,
			sortKey
		};
		await models.RouteSettings.findOneAndUpdate(
			{ _routeId: update._routeId, _userId: update._userId },
			update,
			{
				_createdById: new Types.ObjectId(locals.user._id),
				context: 'query',
				setDefaultsOnInsert: true,
				upsert: true
			}
		);
		return {};
	},
	update: async ({ locals, request }) => {
		const formData = await request.formData();

		const _id = formData.get('_id')?.toString();
		if (!_id) return fail(400, { error: 'Missing _id' });

		const modelName = formData.get('modelName') as ModelName;
		if (!modelName) return fail(400, { error: 'Missing modelName' });

		const model = modelCache.get(modelName);
		if (!model) return fail(400, { error: `Model "${modelName}" doesn't exist` });

		const data: Record<string, any> = {};

		for (const [key, value] of formData.entries()) {
			if (key === 'modelName' || key === '_id') continue;

			if (data[key] !== undefined) {
				// Convert to array if duplicate keys
				data[key] = Array.isArray(data[key]) ? [...data[key], value] : [data[key], value];
			} else {
				data[key] = value;
			}
		}

		const sanitizedData = sanitizeDataFromSchema(model, data);

		const row = await model
			.findByIdAndUpdate(_id, sanitizedData, {
				_createdById: new Types.ObjectId(locals.user._id),
				context: 'query',
				new: true
			})
			.lean();

		return { row: JSON.parse(JSON.stringify(row)) };
	}
};
