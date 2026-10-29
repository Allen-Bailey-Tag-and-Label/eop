import { validateAssetScope } from './asset-library';
import { allElements } from '$lib/slides/repeater';
import { slideIsVisible } from '$lib/slides/visibility';
import { createHash } from 'node:crypto';
import { Types } from 'mongoose';
import { error } from '@sveltejs/kit';
import { Slide, Playlist, Asset } from './models';
import { MonitorSession } from '../monitors/model';
import { withResponsiveDefaults } from '$lib/slides/layout';
import { withPlaylistDefaults } from '$lib/slides/playlist-transitions';
import { defaultPlaylistTransition } from '$lib/slides/types';
import { createSlideDataResolver } from './data-sources';
import {
	blankSlide,
	type Playback,
	type SlideDefinition,
	type PlaylistDefinition,
	type ContentEditor
} from '$lib/slides/types';
import {
	isId,
	parseJson,
	slug,
	title,
	validateSlide,
	validatePlaylist,
	SlideValidationError
} from '$lib/slides/validation';

export async function listSlideReferences(id: string) {
	if (!isId(id)) return [];
	const rows = await Playlist.find({
		$or: [{ 'draft.items.slideId': id }, { 'published.items.slideId': id }]
	})
		.select('slug title draft.items published.items')
		.sort({ title: 1 })
		.lean();
	return rows.map((row) => ({
		slug: row.slug,
		title: row.title,
		draft: row.draft.items.some((item) => item.slideId === id),
		published: row.published?.items.some((item) => item.slideId === id) ?? false
	}));
}

export async function manageSlide(
	operation: 'unpublish' | 'delete',
	key: string,
	fields: FormData,
	userId: string
) {
	const id = fields.get('id');
	const version = Number(fields.get('version'));
	if (!isId(id) || !Number.isInteger(version) || version < 1)
		throw new SlideValidationError('Invalid slide version. Reload the editor.');
	const filter = { _id: id, slug: key, version };
	const options = { _createdById: userId };
	if (operation === 'delete') {
		// Recheck persistence on submission; the editor's reference list may be stale.
		const references = await listSlideReferences(id);
		if (references.length) return references;
		const result = await Slide.deleteOne(filter, options);
		if (result.deletedCount) return [];
	} else {
		const result = await Slide.updateOne(
			{ ...filter, published: { $exists: true } },
			{ $unset: { published: 1, publishedAt: 1, publishedTitle: 1 }, $inc: { version: 1 } },
			{ ...options, runValidators: true }
		);
		if (result.modifiedCount) return [];
	}
	throw new SlideValidationError('This slide changed in another editor. Reload before continuing.');
}

export async function listSlides() {
	const rows = await Slide.find()
		.select('slug title version publishedAt')
		.sort({ title: 1 })
		.limit(1000)
		.lean();
	return rows.map((row) => ({
		id: row._id.toString(),
		slug: row.slug,
		title: row.title,
		version: row.version,
		publishedAt: row.publishedAt?.toISOString() ?? null
	}));
}

export async function duplicateSlide(fields: FormData, userId: string) {
	const id = fields.get('id');
	const version = Number(fields.get('version'));
	if (!isId(id) || !Number.isInteger(version) || version < 1)
		throw new SlideValidationError('Invalid slide version. Reload the slide list.');
	const source = await Slide.findOne({ _id: id, version }).select('slug title draft').lean();
	if (!source)
		throw new SlideValidationError(
			'This slide changed or no longer exists. Reload the slide list.'
		);
	const copyId = new Types.ObjectId();
	const key = `${source.slug.slice(0, 50).replace(/-+$/, '')}-copy-${copyId.toHexString()}`;
	const draft = validateSlide(withResponsiveDefaults(source.draft));
	// Retain media references just as imported/copied artwork does. Asset reference checks
	// keep those files available to both slides, including media in nested templates.
	await Slide.create({
		_id: copyId,
		slug: key,
		title: `${source.title.slice(0, 153)} (copy)`,
		version: 1,
		draft,
		_createdById: userId
	});
	return key;
}
export async function listPlaylists() {
	const rows = await Playlist.find()
		.select('slug title version publishedAt')
		.sort({ title: 1 })
		.limit(1000)
		.lean();
	return rows.map((row) => ({
		id: row._id.toString(),
		slug: row.slug,
		title: row.title,
		version: row.version,
		publishedAt: row.publishedAt?.toISOString() ?? null
	}));
}

export async function duplicatePlaylist(fields: FormData, userId: string) {
	const id = fields.get('id');
	const version = Number(fields.get('version'));
	if (!isId(id) || !Number.isInteger(version) || version < 1)
		throw new SlideValidationError('Invalid playlist version. Reload the playlist list.');
	const source = await Playlist.findOne({ _id: id, version }).select('slug title draft').lean();
	if (!source)
		throw new SlideValidationError(
			'This playlist changed or no longer exists. Reload the playlist list.'
		);
	const copyId = new Types.ObjectId();
	const key = `${source.slug.slice(0, 50).replace(/-+$/, '')}-copy-${copyId.toHexString()}`;
	await Playlist.create({
		_id: copyId,
		slug: key,
		title: `${source.title.slice(0, 153)} (copy)`,
		version: 1,
		draft: validatePlaylist(source.draft),
		_createdById: userId
	});
	return key;
}

export async function deletePlaylist(fields: FormData, userId: string) {
	const id = fields.get('id');
	const version = Number(fields.get('version'));
	if (!isId(id) || !Number.isInteger(version) || version < 1)
		throw new SlideValidationError('Invalid playlist version. Reload the playlist list.');
	if (fields.get('confirm') !== 'delete')
		throw new SlideValidationError('Confirm deletion before deleting this playlist.');
	const key = slug(fields.get('slug'));
	const assigned = await MonitorSession.find({ playlistId: id, status: 'approved' })
		.select('location')
		.lean();
	if (assigned.length)
		return assigned.map((monitor) => ({ id: monitor._id.toString(), location: monitor.location }));
	const result = await Playlist.deleteOne(
		{ _id: id, slug: key, version },
		{ _createdById: userId }
	);
	if (!result.deletedCount)
		throw new SlideValidationError(
			'This playlist changed or no longer exists. Reload the playlist list.'
		);
	return [];
}
export function getEditor(kind: 'slide', key: string): Promise<ContentEditor<SlideDefinition>>;
export function getEditor(
	kind: 'playlist',
	key: string
): Promise<ContentEditor<PlaylistDefinition>>;
export async function getEditor(kind: 'slide' | 'playlist', key: string) {
	if (key === 'new')
		return {
			id: '',
			slug: '',
			title: '',
			version: 0,
			publishedAt: null,
			draft: kind === 'slide' ? blankSlide() : withPlaylistDefaults({ items: [], loop: true })
		};
	const row =
		kind === 'slide'
			? await Slide.findOne({ slug: key }).lean()
			: await Playlist.findOne({ slug: key }).lean();
	if (!row) error(404, 'Content not found.');
	return {
		id: row._id.toString(),
		slug: row.slug,
		title: row.title,
		version: row.version,
		publishedAt: row.publishedAt?.toISOString() ?? null,
		draft:
			kind === 'slide'
				? withResponsiveDefaults(row.draft as SlideDefinition)
				: withPlaylistDefaults(row.draft as PlaylistDefinition)
	};
}
export async function validateAssets(definition: SlideDefinition) {
	const ids = [
		...new Set(
			allElements(definition)
				.filter((e) => e.type === 'image' || e.type === 'svg')
				.map((e) => e.assetId)
		)
	];
	if (!ids.length) return;
	const assets = await Asset.find({ _id: { $in: ids } })
		.select('contentType')
		.lean();
	for (const element of allElements(definition)) {
		if (element.type !== 'image' && element.type !== 'svg') continue;
		const asset = assets.find((item) => item._id.toString() === element.assetId);
		if (!asset || (element.type === 'svg') !== (asset.contentType === 'image/svg+xml'))
			throw new SlideValidationError(
				'Choose a matching uploaded image or SVG for each media element.'
			);
	}
}
export async function saveContent(kind: 'slide' | 'playlist', fields: FormData, userId: string) {
	const id = fields.get('id');
	const key = slug(fields.get('slug'));
	const label = title(fields.get('title'));
	const version = Number(fields.get('version'));
	if (!Number.isInteger(version) || version < 0 || (id !== '' && !isId(id)))
		throw new SlideValidationError('Invalid content version. Reload the editor.');
	const publish = fields.get('intent') === 'publish';
	const raw = parseJson(fields.get('definition'));
	const definition = kind === 'slide' ? validateSlide(raw) : validatePlaylist(raw);
	const scopeInput = fields.get('assetScopeId');
	if (kind === 'slide' && scopeInput && !isId(scopeInput))
		throw new SlideValidationError('Invalid asset scope. Reload the editor.');
	const slideId =
		id === ''
			? typeof scopeInput === 'string' && scopeInput
				? scopeInput
				: new Types.ObjectId().toString()
			: String(id);
	if (kind === 'slide') {
		await validateAssets(definition as SlideDefinition);
		await validateAssetScope(definition as SlideDefinition, slideId);
	} else {
		const items = (definition as PlaylistDefinition).items;
		const ids = [...new Set(items.map((item) => item.slideId))];
		const count = await Slide.countDocuments({
			_id: { $in: ids },
			...(publish ? { published: { $exists: true } } : {})
		});
		if (count !== ids.length)
			throw new SlideValidationError(
				publish
					? 'Publish all referenced slides before publishing the playlist.'
					: 'A referenced slide no longer exists.'
			);
	}
	const update = {
		slug: key,
		title: label,
		draft: definition,
		...(publish ? { published: definition, publishedAt: new Date(), publishedTitle: label } : {})
	};
	try {
		if (id === '') {
			if (version !== 0) throw new SlideValidationError('Invalid new content version.');
			if (kind === 'slide')
				await Slide.create({
					_id: new Types.ObjectId(slideId),
					...update,
					version: 1,
					_createdById: userId
				});
			else await Playlist.create({ ...update, version: 1, _createdById: userId });
		} else {
			const filter = { _id: id, version };
			const change = { $set: update, $inc: { version: 1 } };
			const options = { runValidators: true, _createdById: userId };
			const result =
				kind === 'slide'
					? await Slide.updateOne(filter, change, options)
					: await Playlist.updateOne(filter, change, options);
			if (!result.modifiedCount)
				throw new SlideValidationError(
					'This content changed in another editor. Reload before saving.'
				);
		}
	} catch (cause) {
		if (typeof cause === 'object' && cause && 'code' in cause && cause.code === 11000)
			throw new SlideValidationError('That slug is already in use.');
		throw cause;
	}
	return { slug: key, published: publish };
}
export async function assignPlaylist(monitorId: unknown, playlistId: unknown) {
	if (!isId(monitorId) || (playlistId !== '' && !isId(playlistId))) return false;
	if (playlistId && !(await Playlist.exists({ _id: playlistId, published: { $exists: true } })))
		return false;
	const result = await MonitorSession.updateOne(
		{ _id: monitorId, status: 'approved' },
		playlistId
			? { $set: { playlistId: new Types.ObjectId(playlistId as string) } }
			: { $unset: { playlistId: 1 } }
	);
	return result.matchedCount === 1;
}
export async function getPlayback(monitorId: string, now = new Date()): Promise<Playback | null> {
	const monitor = await MonitorSession.findById(monitorId).select('playlistId').lean();
	if (!monitor?.playlistId) return null;
	const playlist = await Playlist.findById(monitor.playlistId)
		.select('publishedTitle published')
		.lean();
	if (!playlist?.published) return null;
	const rows = await Slide.find({
		_id: { $in: playlist.published.items.map((item) => item.slideId) },
		published: { $exists: true }
	})
		.select('published publishedTitle')
		.lean();
	const slides = playlist.published.items.flatMap((item, index) => {
		const slide = rows.find((row) => row._id.toString() === item.slideId);
		return slide?.published
			? [
					{
						id: slide._id.toString(),
						title: slide.publishedTitle ?? `Slide ${index + 1}`,
						definition: withResponsiveDefaults(slide.published),
						durationMs: item.durationMs ?? slide.published.durationMs,
						...(item.transition ? { transition: item.transition } : {})
					}
				]
			: [];
	});
	if (!slides.length) return null;
	const resolveData = createSlideDataResolver();
	const eligible = (
		await Promise.all(
			slides.map(async (slide) => ({ ...slide, data: await resolveData(slide.definition) }))
		)
	).filter((slide) => slideIsVisible(slide.definition.visibility, slide.data, now));
	const content = {
		transition: playlist.published.transition ?? defaultPlaylistTransition(),
		title: playlist.publishedTitle ?? 'Monitor playlist',
		loop: playlist.published.loop,
		randomStart: playlist.published.randomStart ?? false,
		upcomingCount: playlist.published.upcomingCount ?? 3,
		slides: eligible.map((slide) => ({
			id: slide.id,
			title: slide.title,
			definition: slide.definition,
			durationMs: slide.durationMs,
			...(slide.transition ? { transition: slide.transition } : {})
		}))
	};
	return {
		...content,
		slides: eligible,
		version: createHash('sha256').update(JSON.stringify(content)).digest('hex')
	};
}
