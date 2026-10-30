import { createHash } from 'node:crypto';
import { DataSource, DataSourceCache, DataConnection } from './models';
import { apiRows, validateConnection } from './api';
import {
	DataWorkflowError,
	blankWorkflow,
	type SourceOption,
	type SourceReference,
	type WorkflowResult
} from '$lib/data/types';
import {
	validateWorkflow,
	executeWorkflow,
	dataRecord,
	substituteParameters
} from '$lib/data/workflows';
import { normalizeDataSource, validateLink } from '$lib/slides/data-link';
import { queryLink } from '../slides/data-sources';
import { Slide } from '../slides/models';
import { allElements } from '$lib/slides/repeater';

const isId = (value: unknown): value is string =>
	typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);
const label = (value: unknown) => {
	const text = String(value ?? '').trim();
	if (!text || text.length > 160)
		throw new DataWorkflowError('Enter a title up to 160 characters.');
	return text;
};
const parse = (value: FormDataEntryValue | null) => {
	if (typeof value !== 'string' || value.length > 200000)
		throw new DataWorkflowError('Invalid or oversized definition.');
	try {
		return JSON.parse(value);
	} catch {
		throw new DataWorkflowError('Definition must be valid JSON.');
	}
};
const version = (fields: FormData) => {
	const value = Number(fields.get('version'));
	if (!Number.isInteger(value) || value < 0)
		throw new DataWorkflowError('Reload the current version.');
	return value;
};
const libraryScope = (scopeId?: string) =>
	scopeId
		? {
				$or: [
					{ scope: 'shared' },
					{ scope: { $exists: false } },
					{ scope: 'slide', slideId: scopeId }
				]
			}
		: {};
export async function sourceOptions(
	scopeId?: string,
	referencedIds: string[] = []
): Promise<SourceOption[]> {
	const visible = libraryScope(scopeId);
	if (visible.$or && referencedIds.length)
		(visible.$or as Record<string, unknown>[]).push({ _id: { $in: referencedIds.filter(isId) } });
	const rows = await DataSource.find({ ...visible, published: { $exists: true } })
		.select('publishedTitle title published')
		.sort({ title: 1 })
		.lean();
	return rows.map((row) => ({
		id: String(row._id),
		title: row.publishedTitle ?? row.title,
		outputs: Object.fromEntries(
			Object.entries(row.published!.outputs).map(([name, output]) => [name, output.fields])
		),
		parameters: row.published!.parameters
	}));
}
export async function listSources(scopeId?: string) {
	const rows = await DataSource.find(libraryScope(scopeId))
		.select('title version publishedAt scope slideId')
		.sort({ title: 1 })
		.lean();
	return rows.map((row) => ({
		id: String(row._id),
		title: row.title,
		version: row.version,
		scope: row.scope ?? 'shared',
		slideId: row.slideId,
		publishedAt: row.publishedAt?.toISOString() ?? null
	}));
}
export async function listConnections() {
	const rows = await DataConnection.find().select('title version config').sort({ title: 1 }).lean();
	return rows.map((row) => ({
		id: String(row._id),
		title: row.title,
		version: row.version,
		config: row.config
	}));
}
export async function sourceUsage(id: string) {
	if (!isId(id)) return [];
	const slides = await Slide.find().select('title slug draft published').lean();
	return slides.flatMap((slide) => {
		const draft = allElements(slide.draft).some(
			(element) => element.dataReference?.sourceId === id
		);
		const published = slide.published
			? allElements(slide.published).some((element) => element.dataReference?.sourceId === id)
			: false;
		return draft || published ? [{ title: slide.title, slug: slide.slug, draft, published }] : [];
	});
}
export async function getSource(id: string, scopeId?: string) {
	if (id === 'new')
		return { id: '', title: '', version: 0, publishedAt: null, draft: blankWorkflow() };
	if (!isId(id)) throw new DataWorkflowError('Invalid data source ID.');
	const row = await DataSource.findById(id).lean();
	if (!row || (scopeId && row.scope === 'slide' && row.slideId !== scopeId))
		throw new DataWorkflowError('Data source not found in this slide or shared library.');
	return {
		id: String(row._id),
		title: row.title,
		version: row.version,
		scope: row.scope ?? 'shared',
		slideId: row.slideId,
		publishedAt: row.publishedAt?.toISOString() ?? null,
		draft: row.draft
	};
}
export async function previewWorkflow(
	raw: unknown,
	parameters: unknown = {},
	now = new Date(),
	previewAll = true
): Promise<WorkflowResult> {
	const definition = validateWorkflow(raw);
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15000);
	try {
		const run = executeWorkflow(
			definition,
			dataRecord(parameters),
			{
				database: async (raw, params) => {
					if (controller.signal.aborted) throw new DataWorkflowError('Workflow timed out.');
					const query = normalizeDataSource(raw);
					query.filter = JSON.stringify(substituteParameters(JSON.parse(query.filter), params));
					query.pipeline = JSON.stringify(
						substituteParameters(JSON.parse(query.pipeline ?? '[]'), params)
					);
					validateLink(query, false);
					try {
						const result = await queryLink(query, now);
						return result.items.map((row) => ({ _id: row.id, ...row.fields }));
					} catch {
						throw new DataWorkflowError(
							'Database node failed. Check its model, fields, and query.'
						);
					}
				},
				api: async (config, params) => {
					if (controller.signal.aborted) throw new DataWorkflowError('Workflow timed out.');
					const connection = await DataConnection.findById(config.connectionId).lean();
					if (!connection) throw new DataWorkflowError('API connection not found.');
					return apiRows(connection.config, config, params, controller.signal);
				}
			},
			now,
			previewAll
		);
		return await Promise.race([
			run,
			new Promise<never>((_resolve, reject) =>
				controller.signal.addEventListener(
					'abort',
					() => reject(new DataWorkflowError('Workflow exceeded 15 seconds.')),
					{ once: true }
				)
			)
		]);
	} catch (cause) {
		if (cause instanceof DataWorkflowError) throw cause;
		throw new DataWorkflowError(
			'Workflow execution failed. Check node configuration and expression values.'
		);
	} finally {
		clearTimeout(timeout);
		controller.abort();
	}
}
const inFlight = new Map<string, Promise<Omit<WorkflowResult, 'nodes'>>>();
export async function resolveSource(
	reference: SourceReference,
	now = new Date()
): Promise<Omit<WorkflowResult, 'nodes'>> {
	const source = await DataSource.findById(reference.sourceId)
		.select('published publishedAt version')
		.lean();
	if (!source?.published) throw new DataWorkflowError('Choose a published data source.');
	const definition = validateWorkflow(source.published);
	const parameters = { ...definition.parameters, ...dataRecord(reference.parameters) };
	const apiIds = definition.nodes
		.filter((node) => node.type === 'api')
		.map((node) => String(node.config.connectionId));
	const connectionVersions = apiIds.length
		? (
				await DataConnection.find({ _id: { $in: apiIds } })
					.select('version')
					.lean()
			)
				.map((connection) => [String(connection._id), connection.version])
				.sort()
		: [];
	const key = createHash('sha256')
		.update(
			JSON.stringify([
				reference.sourceId,
				source.publishedAt?.toISOString(),
				definition,
				connectionVersions,
				Object.entries(parameters).sort(([a], [b]) => a.localeCompare(b))
			])
		)
		.digest('hex');
	const cached =
		definition.refreshSeconds || definition.staleSeconds
			? await DataSourceCache.findOne({ key }).lean()
			: null;
	if (cached && cached.freshUntil > now) return cached.result;
	if (!inFlight.has(key)) {
		const promise = (async () => {
			try {
				const result = await previewWorkflow(definition, parameters, now, false);
				const published = { outputs: result.outputs, updatedAt: result.updatedAt };
				if (definition.refreshSeconds || definition.staleSeconds) {
					const freshUntil = new Date(now.getTime() + definition.refreshSeconds * 1000);
					const usableUntil = new Date(freshUntil.getTime() + definition.staleSeconds * 1000);
					await DataSourceCache.updateOne(
						{ key },
						{
							$set: {
								sourceId: reference.sourceId,
								result: published,
								freshUntil,
								usableUntil,
								expiresAt: usableUntil
							}
						},
						{ upsert: true }
					);
				}
				return published;
			} catch (cause) {
				if (cached && definition.staleSeconds && cached.usableUntil > now)
					return { ...cached.result, stale: true };
				throw cause;
			}
		})();
		inFlight.set(key, promise);
		void promise.finally(() => inFlight.delete(key)).catch(() => {});
	}
	return inFlight.get(key)!;
}
export async function saveSource(fields: FormData, userId: string, scopeId?: string) {
	const id = fields.get('id'),
		expected = version(fields);
	if (id && scopeId) await getSource(String(id), scopeId);
	const title = label(fields.get('title'));
	const draft = validateWorkflow(parse(fields.get('definition')));
	const publish = fields.get('intent') === 'publish';
	if (publish) {
		if (isId(id)) {
			const slides = await Slide.find().select('title draft published').lean();
			for (const slide of slides) {
				const inspect = (
					elements: import('$lib/slides/types').SlideElement[],
					inherited?: SourceReference
				) => {
					for (const element of elements) {
						const reference = element.dataReference ?? inherited;
						if (reference?.sourceId === id) {
							for (const parameter of Object.keys(reference.parameters))
								if (!Object.hasOwn(draft.parameters, parameter))
									throw new DataWorkflowError(
										`Parameter ${parameter} is used by ${slide.title}. Update its source parameters first.`
									);
							const output = draft.outputs[reference.output];
							if (!output)
								throw new DataWorkflowError(
									`Output ${reference.output} is used by ${slide.title}. Update its slide references before removing it.`
								);
							for (const binding of [...Object.values(element.bindings ?? {}), element.binding]) {
								if (
									binding?.field.startsWith('row.') &&
									!output.fields.includes(binding.field.slice(4))
								)
									throw new DataWorkflowError(
										`Field ${binding.field} is used by ${slide.title}. Keep it in the published output or update that slide.`
									);
							}
						}
						if (element.frame) inspect(element.frame.elements, reference);
						if (element.repeater) inspect(element.repeater.template.elements, reference);
					}
				};
				inspect(slide.draft.elements);
				if (slide.published) inspect(slide.published.elements);
			}
		}
		await previewWorkflow(draft, {});
	}
	const update = {
		title,
		draft,
		...(publish ? { published: draft, publishedTitle: title, publishedAt: new Date() } : {})
	};
	if (!id) {
		const created = await DataSource.create({
			...update,
			scope: fields.get('scope') === 'shared' ? 'shared' : 'slide',
			slideId: scopeId,
			version: 1,
			_createdById: userId
		});
		return String(created._id);
	}
	if (!isId(id) || !expected) throw new DataWorkflowError('Invalid source version.');
	const options = { _createdById: userId, runValidators: true };
	const result = await DataSource.updateOne(
		{ _id: id, version: expected },
		{ $set: update, $inc: { version: 1 } },
		options
	);
	if (!result.matchedCount)
		throw new DataWorkflowError('The source changed. Reload before saving.');
	return id;
}
export async function deleteSource(fields: FormData, userId: string, scopeId?: string) {
	const id = fields.get('id');
	if (!isId(id) || fields.get('confirm') !== 'delete')
		throw new DataWorkflowError('Confirm source deletion.');
	if (scopeId) await getSource(id, scopeId);
	if ((await sourceUsage(id)).length)
		throw new DataWorkflowError(
			'Remove this source from all draft and published slides before deleting it.'
		);
	const options = { _createdById: userId };
	const result = await DataSource.deleteOne({ _id: id, version: version(fields) }, options);
	if (!result.deletedCount)
		throw new DataWorkflowError('The source changed or was removed. Reload.');
	await DataSourceCache.deleteMany({ sourceId: id });
}
export async function saveConnection(fields: FormData, userId: string) {
	const id = fields.get('id'),
		expected = version(fields);
	const update = {
		title: label(fields.get('title')),
		config: validateConnection(parse(fields.get('definition')))
	};
	if (!id) await DataConnection.create({ ...update, version: 1, _createdById: userId });
	else {
		if (!isId(id) || !expected) throw new DataWorkflowError('Invalid connection version.');
		const options = { _createdById: userId, runValidators: true };
		const result = await DataConnection.updateOne(
			{ _id: id, version: expected },
			{ $set: update, $inc: { version: 1 } },
			options
		);
		if (!result.matchedCount)
			throw new DataWorkflowError('The connection changed. Reload before saving.');
	}
	await DataSourceCache.deleteMany({});
}
export async function deleteConnection(fields: FormData, userId: string) {
	const id = fields.get('id');
	if (!isId(id) || fields.get('confirm') !== 'delete')
		throw new DataWorkflowError('Confirm connection deletion.');
	if (
		await DataSource.exists({
			$or: [
				{ 'draft.nodes.config.connectionId': id },
				{ 'published.nodes.config.connectionId': id }
			]
		})
	)
		throw new DataWorkflowError('This connection is used by a draft or published source.');
	const options = { _createdById: userId };
	const result = await DataConnection.deleteOne({ _id: id, version: version(fields) }, options);
	if (!result.deletedCount) throw new DataWorkflowError('The connection changed. Reload.');
}

export async function moveSource(fields: FormData, scopeId: string, userId: string) {
	const id = String(fields.get('id') ?? '');
	await getSource(id, scopeId);
	if (fields.get('confirm') !== 'move')
		throw new DataWorkflowError('Confirm moving this data link.');
	const scope = fields.get('scope');
	if (scope !== 'slide' && scope !== 'shared')
		throw new DataWorkflowError('Choose a data library.');
	const options = { _createdById: userId, runValidators: true };
	const result = await DataSource.updateOne(
		{ _id: id, version: version(fields) },
		{ $set: { scope, slideId: scope === 'slide' ? scopeId : null }, $inc: { version: 1 } },
		options
	);
	if (!result.matchedCount) throw new DataWorkflowError('The data link changed. Reload.');
}
