import JSZip from 'jszip';
import type { Readable } from 'node:stream';
import type { WorkflowDefinition } from '$lib/data/types';
import { Types } from 'mongoose';
import { Asset, Slide } from './models';
import { DataConnection, DataSource } from '../data/models';
import { validateConnection } from '../data/api';
import { validateWorkflow } from '$lib/data/workflows';
import { allElements, collectionReference } from '$lib/slides/repeater';
import {
	validateSlide,
	SlideValidationError,
	isId,
	slug as validateSlug
} from '$lib/slides/validation';
import { prepareAsset } from './assets';
import {
	MAX_PACKAGE_BYTES,
	type SlidePackage,
	type PackageChoices,
	type PackageReview
} from '$lib/slides/package';

function reject(message: string): never {
	throw new SlideValidationError(message);
}
const label = (value: unknown) =>
	typeof value === 'string' && value.trim() && value.length <= 160
		? value.trim()
		: reject('Enter a title/name under 160 characters.');
const unique = (items: { id: string }[]) => {
	if (
		items.some((item) => !isId(item.id)) ||
		new Set(items.map((item) => item.id)).size !== items.length
	)
		reject('Package resource IDs must be unique database IDs.');
};
function stringIds(value: unknown): string[] {
	if (typeof value === 'string') return isId(value) ? [value] : [];
	if (!value || typeof value !== 'object') return [];
	return Object.values(value).flatMap(stringIds);
}
function replaceIds<T>(value: T, ids: Map<string, string>): T {
	if (typeof value === 'string') return (ids.get(value) ?? value) as T;
	if (Array.isArray(value)) return value.map((item) => replaceIds(item, ids)) as T;
	if (!value || typeof value !== 'object') return value;
	return Object.fromEntries(
		Object.entries(value).map(([key, item]) => [key, replaceIds(item, ids)])
	) as T;
}
function dependencies(bundle: SlidePackage) {
	const sources = new Set(bundle.sources.map((item) => item.id));
	const assets = new Set(bundle.assets.map((item) => item.id));
	const connections = new Set(bundle.connections.map((item) => item.id));
	for (const element of allElements(bundle.slide.definition)) {
		for (const reference of [element.dataReference, collectionReference(element)])
			if (reference && !sources.has(reference.sourceId))
				reject('A referenced data link is missing from the package.');
		for (const id of [element.assetId, element.bindings?.assetId?.fallback])
			if (isId(id) && !assets.has(id)) reject('A referenced asset is missing from the package.');
	}
	for (const source of bundle.sources)
		for (const definition of [source.draft, source.published]) {
			for (const node of definition?.nodes ?? [])
				if (node.type === 'api' && !connections.has(String(node.config.connectionId)))
					reject('A referenced API connection is missing from the package.');
		}
}
export async function exportSlidePackage(title: string, slug: string, raw: unknown) {
	const definition = validateSlide(raw);
	const elements = allElements(definition);
	const sourceIds = [
		...new Set(
			elements
				.flatMap((element) => [
					element.dataReference?.sourceId,
					collectionReference(element)?.sourceId
				])
				.filter(isId)
		)
	];
	const sourceRows = await DataSource.find({ _id: { $in: sourceIds } }).lean();
	const sources: SlidePackage['sources'] = sourceRows.map((row) => ({
		id: String(row._id),
		title: row.title,
		scope: row.scope === 'slide' ? 'slide' : 'shared',
		draft: validateWorkflow(row.draft),
		...(row.published ? { published: validateWorkflow(row.published) } : {})
	}));
	const connectionIds = [
		...new Set(
			sources.flatMap((source) =>
				[source.draft, source.published].flatMap(
					(workflow) =>
						workflow?.nodes
							.filter((node) => node.type === 'api')
							.map((node) => String(node.config.connectionId)) ?? []
				)
			)
		)
	];
	const connectionRows = await DataConnection.find({ _id: { $in: connectionIds } }).lean();
	const connections = connectionRows.map((row) => ({
		id: String(row._id),
		title: row.title,
		config: validateConnection(row.config)
	}));
	const directAssets = elements
		.flatMap((element) => [element.assetId, element.bindings?.assetId?.fallback])
		.filter(isId);
	// Include uploaded asset IDs embedded in literal/map workflow configuration and source parameters.
	const candidates = [
		...new Set([
			...directAssets,
			...stringIds(sources),
			...elements.flatMap((element) => stringIds(element.repeatItems ?? element.dataReference))
		])
	];
	const assetRows = await Asset.find({ _id: { $in: candidates } })
		.select('+data')
		.lean();
	const zip = new JSZip();
	const assets: SlidePackage['assets'] = assetRows.map((row) => {
		const id = String(row._id),
			path = `assets/${id}`;
		zip.file(
			path,
			Buffer.isBuffer(row.data)
				? row.data
				: Buffer.from(row.data.buffer.subarray(0, row.data.position))
		);
		return {
			id,
			path,
			name: row.name,
			contentType: row.contentType,
			scope: row.scope === 'shared' ? 'shared' : 'slide'
		};
	});
	const bundle: SlidePackage = {
		format: 'eop-slide',
		version: 1,
		slide: { title: label(title), slug, definition },
		assets,
		sources,
		connections
	};
	dependencies(bundle);
	if (assets.length > 100 || sources.length > 100 || connections.length > 30)
		reject('Package supports at most 100 assets, 100 data links and 30 API connections.');
	const manifest = JSON.stringify(bundle);
	const assetSize = assetRows.reduce(
		(sum, row) => sum + (Buffer.isBuffer(row.data) ? row.data.length : row.data.position),
		0
	);
	if (
		Buffer.byteLength(manifest) > 1000000 ||
		assetSize + Buffer.byteLength(manifest) > 20 * 1024 * 1024
	)
		reject('Package expanded contents exceed the import limits.');
	zip.file('slide.json', manifest);
	const bytes = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
	if (bytes.length > MAX_PACKAGE_BYTES)
		reject('Slide package exceeds the 4 MB transfer limit. Reduce asset sizes before exporting.');
	return bytes;
}
// Stream each entry with an actual output cap as well as checking ZIP metadata.
async function readEntry(file: JSZip.JSZipObject, limit: number): Promise<Buffer> {
	return new Promise((resolve, rejectEntry) => {
		const chunks: Buffer[] = [];
		let size = 0;
		const stream = file.nodeStream() as Readable;
		stream.on('data', (chunk: Buffer) => {
			size += chunk.length;
			if (size > limit) {
				stream.pause();
				stream.destroy();
				rejectEntry(new SlideValidationError('Expanded package entry is too large.'));
			} else chunks.push(chunk);
		});
		stream.on('error', () =>
			rejectEntry(new SlideValidationError('Could not decompress package entry.'))
		);
		stream.on('end', () => resolve(Buffer.concat(chunks)));
	});
}
export async function readSlidePackage(bytes: Buffer) {
	if (!bytes.length || bytes.length > MAX_PACKAGE_BYTES)
		reject('Choose a slide ZIP package under 4 MB.');
	let zip: JSZip;
	try {
		zip = await JSZip.loadAsync(bytes);
	} catch {
		return reject('Could not read this ZIP package.');
	}
	const files = Object.values(zip.files).filter((file) => !file.dir);
	let total = 0;
	for (const file of files) {
		const size = (file as unknown as { _data?: { uncompressedSize?: number } })._data
			?.uncompressedSize;
		if (typeof size !== 'number' || size > 3 * 1024 * 1024) reject('Package entry is too large.');
		total += size;
	}
	if (files.length > 250 || total > 20 * 1024 * 1024)
		reject('Package contents exceed the import limits.');
	const manifest = zip.file('slide.json');
	if (!manifest) reject('Package is missing slide.json.');
	const text = (await readEntry(manifest, 1000000)).toString('utf8');
	if (text.length > 1000000) reject('Package definition is too large.');
	let input: SlidePackage;
	try {
		input = JSON.parse(text);
	} catch {
		return reject('Package contains invalid JSON.');
	}
	if (
		input?.format !== 'eop-slide' ||
		input.version !== 1 ||
		!input.slide ||
		!Array.isArray(input.assets) ||
		!Array.isArray(input.sources) ||
		!Array.isArray(input.connections)
	)
		reject('Unsupported slide package.');
	if (
		[...input.assets, ...input.sources, ...input.connections].some(
			(item) => !item || typeof item !== 'object' || Array.isArray(item)
		)
	)
		reject('Invalid package resource.');
	if (input.assets.length > 100 || input.sources.length > 100 || input.connections.length > 30)
		reject('Too many package resources.');
	const bundle: SlidePackage = {
		format: 'eop-slide',
		version: 1,
		slide: {
			title: label(input.slide.title),
			slug: String(input.slide.slug ?? ''),
			definition: validateSlide(input.slide.definition)
		},
		assets: input.assets.map((item) => ({
			id: item.id,
			name: label(item.name),
			contentType: item.contentType,
			path: `assets/${item.id}`,
			scope: item.scope === 'shared' ? 'shared' : 'slide'
		})),
		sources: input.sources.map((item) => ({
			id: item.id,
			title: label(item.title),
			scope: item.scope === 'shared' ? 'shared' : 'slide',
			draft: validateWorkflow(item.draft),
			...(item.published ? { published: validateWorkflow(item.published) } : {})
		})),
		connections: input.connections.map((item) => ({
			id: item.id,
			title: label(item.title),
			config: validateConnection(item.config)
		}))
	};
	for (const items of [bundle.assets, bundle.sources, bundle.connections]) unique(items);
	if (
		new Set([...bundle.assets, ...bundle.sources, ...bundle.connections].map((item) => item.id))
			.size !==
		bundle.assets.length + bundle.sources.length + bundle.connections.length
	)
		reject('Package resource IDs overlap.');
	dependencies(bundle);
	const assetBytes = new Map<string, Buffer>();
	for (const asset of bundle.assets) {
		const file = zip.file(asset.path);
		if (!file) reject(`Missing asset file: ${asset.name}.`);
		assetBytes.set(
			asset.id,
			prepareAsset(await readEntry(file, 3 * 1024 * 1024), asset.contentType)
		);
	}
	return { bundle, assetBytes };
}
export async function reviewSlidePackage(bytes: Buffer): Promise<PackageReview> {
	const { bundle } = await readSlidePackage(bytes);
	const [assets, sources, connections] = await Promise.all([
		Asset.find({ scope: 'shared' }).select('name').lean(),
		DataSource.find({ $or: [{ scope: 'shared' }, { scope: { $exists: false } }] })
			.select('title')
			.lean(),
		DataConnection.find().select('title').lean()
	]);
	return {
		package: bundle,
		existing: {
			assets: assets.map((row) => ({ id: String(row._id), title: row.name })),
			sources: sources.map((row) => ({ id: String(row._id), title: row.title })),
			connections: connections.map((row) => ({ id: String(row._id), title: row.title }))
		}
	};
}
export async function importSlidePackage(
	bytes: Buffer,
	title: string,
	slug: string,
	choices: PackageChoices,
	userId: string
) {
	const { bundle, assetBytes } = await readSlidePackage(bytes);
	const key = validateSlug(slug),
		name = label(title);
	if (await Slide.exists({ slug: key }))
		reject('That slide slug already exists. Choose a new slug.');
	const slideId = new Types.ObjectId();
	const ids = new Map<string, string>();
	const reusedSources = new Map<
		string,
		{ title: string; draft: WorkflowDefinition; published?: WorkflowDefinition }
	>();
	for (const kind of ['assets', 'sources', 'connections'] as const) {
		if (
			!choices ||
			!choices[kind] ||
			typeof choices[kind] !== 'object' ||
			Array.isArray(choices[kind])
		)
			reject('Invalid resource choices.');
		for (const resource of bundle[kind]) {
			const target = choices[kind][resource.id];
			if (!target) {
				ids.set(resource.id, String(new Types.ObjectId()));
				continue;
			}
			if (!isId(target)) reject('Invalid reusable resource.');
			const row =
				kind === 'assets'
					? await Asset.findOne({ _id: target, scope: 'shared' })
					: kind === 'sources'
						? await DataSource.findOne({
								_id: target,
								$or: [{ scope: 'shared' }, { scope: { $exists: false } }]
							})
						: await DataConnection.findById(target);
			if (!row) reject('A selected shared resource no longer exists. Review the import again.');
			if (kind === 'sources')
				reusedSources.set(
					resource.id,
					row as unknown as {
						title: string;
						draft: WorkflowDefinition;
						published?: WorkflowDefinition;
					}
				);
			ids.set(resource.id, target);
		}
	}
	// Reused links must expose the outputs/fields expected by the transferred slide.
	for (const source of bundle.sources) {
		const reused = reusedSources.get(source.id);
		if (!reused) continue;
		if (source.published && !reused.published)
			reject(
				`Shared data link ${reused.title} must be published before it can replace this source.`
			);
		const target = validateWorkflow(reused.published ?? reused.draft);
		const required = source.published ?? source.draft;
		for (const [output, settings] of Object.entries(required.outputs))
			if (
				!target.outputs[output] ||
				settings.fields.some((field) => !target.outputs[output].fields.includes(field))
			)
				reject(`Shared data link ${reused.title} has incompatible outputs.`);
		for (const element of allElements(bundle.slide.definition))
			for (const reference of [element.dataReference, collectionReference(element)])
				if (
					reference?.sourceId === source.id &&
					Object.keys(reference.parameters).some(
						(parameter) => !Object.hasOwn(target.parameters, parameter)
					)
				)
					reject(`Shared data link ${reused.title} has incompatible parameters.`);
	}
	const created = { assets: [] as string[], sources: [] as string[], connections: [] as string[] };
	try {
		for (const connection of bundle.connections)
			if (!choices.connections[connection.id]) {
				const id = ids.get(connection.id)!;
				await DataConnection.create({
					_id: id,
					title: connection.title,
					config: connection.config,
					version: 1,
					_createdById: userId
				});
				created.connections.push(id);
			}
		for (const asset of bundle.assets)
			if (!choices.assets[asset.id]) {
				const id = ids.get(asset.id)!;
				await Asset.create({
					_id: id,
					name: asset.name,
					contentType: asset.contentType,
					data: assetBytes.get(asset.id),
					scope: asset.scope,
					...(asset.scope === 'slide' ? { slideId } : {}),
					_createdById: userId
				});
				created.assets.push(id);
			}
		for (const source of bundle.sources)
			if (!choices.sources[source.id]) {
				const id = ids.get(source.id)!;
				await DataSource.create({
					_id: id,
					title: source.title,
					scope: source.scope,
					...(source.scope === 'slide' ? { slideId: String(slideId) } : {}),
					draft: replaceIds(source.draft, ids),
					...(source.published
						? {
								published: replaceIds(source.published, ids),
								publishedTitle: source.title,
								publishedAt: new Date()
							}
						: {}),
					version: 1,
					_createdById: userId
				});
				created.sources.push(id);
			}
		const draft = validateSlide(replaceIds(bundle.slide.definition, ids));
		await Slide.create({
			_id: slideId,
			title: name,
			slug: key,
			version: 1,
			draft,
			_createdById: userId
		});
		return { slug: key };
	} catch (cause) {
		await Promise.all([
			Asset.deleteMany({ _id: { $in: created.assets } }),
			DataSource.deleteMany({ _id: { $in: created.sources } }),
			DataConnection.deleteMany({ _id: { $in: created.connections } })
		]);
		if (cause && typeof cause === 'object' && 'code' in cause && cause.code === 11000)
			reject('That slide slug was just taken. Choose a new slug.');
		throw cause;
	}
}
