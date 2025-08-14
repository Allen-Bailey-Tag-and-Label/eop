import { fail, type Actions } from '@sveltejs/kit';
import { Types } from 'mongoose';
import * as models from '$lib/server/mongoose/models';
import {
	modelCache,
	sanitizeDataFromSchema,
	sanitizeUiFilters,
	type ModelName,
	type UiFilter
} from './';

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

		const _ids: Types.ObjectId[] = [];

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
		const form = await request.formData();
		const _routeId = String(form.get('_routeId') ?? '');
		const columnsOrder = JSON.parse(form.get('columnsOrder')?.toString() ?? JSON.stringify([]));
		const currentPage = Number(form.get('currentPage') ?? 0);
		const modelName = form.get('modelName') as ModelName | null;
		const rowsPerPage = Number(form.get('rowsPerPage') ?? 10);
		const sortDirection = String(form.get('sortDirection') ?? 'asc');
		const sortKey = String(form.get('sortKey') ?? '');
		const rawFilter = form.get('filter');

		// Parse raw filters safely
		let filtersRaw: unknown = [];
		if (typeof rawFilter === 'string' && rawFilter.trim()) {
			try {
				filtersRaw = JSON.parse(rawFilter);
			} catch {
				/* ignore */
			}
		}

		// If we have a model, sanitize using its schema; otherwise fall back to empty filters
		let sanitizedFilters: UiFilter[] = [];
		if (modelName && modelCache.has(modelName)) {
			sanitizedFilters = sanitizeUiFilters(filtersRaw, modelCache.get(modelName)!);
		}

		// Persist sanitized settings
		const update = {
			_routeId,
			_userId: locals.user._id,
			columnsOrder,
			currentPage,
			filter: sanitizedFilters,
			rowsPerPage,
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
	},

	updateMany: async ({ locals, request }) => {
		const formData = await request.formData();

		const data = JSON.parse(formData?.get('data')?.toString() ?? JSON.stringify({}));
		if (!data) return fail(400, { error: 'Missing data' });

		const modelName = formData.get('modelName') as ModelName;
		if (!modelName) return fail(400, { error: 'Missing modelName' });

		const model = modelCache.get(modelName);
		if (!model) return fail(400, { error: `Model "${modelName}" doesn't exist` });

		for (let i = 0; i < data.length; i++) {
			const { _id, $set } = data[i];

			await model
				.findByIdAndUpdate(_id, sanitizeDataFromSchema(model, $set), {
					_createdById: new Types.ObjectId(locals.user._id),
					context: 'query',
					new: true
				})
				.lean();
		}

		return {};
	}
};
