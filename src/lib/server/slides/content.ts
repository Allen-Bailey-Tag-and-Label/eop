import { createHash } from 'node:crypto';
import { Types } from 'mongoose';
import { error } from '@sveltejs/kit';
import { Slide, Playlist, Asset } from './models';
import { MonitorSession } from '../monitors/model';
import { withResponsiveDefaults } from '$lib/slides/layout';
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
export async function listPlaylists() {
	const rows = await Playlist.find()
		.select('slug title publishedAt')
		.sort({ title: 1 })
		.limit(1000)
		.lean();
	return rows.map((row) => ({
		id: row._id.toString(),
		slug: row.slug,
		title: row.title,
		publishedAt: row.publishedAt?.toISOString() ?? null
	}));
}
export async function listAssets() {
	const rows = await Asset.find()
		.select('name contentType')
		.sort({ createdAt: -1 })
		.limit(500)
		.lean();
	return rows.map((row) => ({
		id: row._id.toString(),
		name: row.name,
		contentType: row.contentType
	}));
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
			draft: kind === 'slide' ? blankSlide() : { items: [], loop: true }
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
		draft: kind === 'slide' ? withResponsiveDefaults(row.draft as SlideDefinition) : row.draft
	};
}
export async function validateAssets(definition: SlideDefinition) {
	const ids = [
		...new Set(
			definition.elements
				.filter((e) => e.type === 'image' || e.type === 'svg')
				.map((e) => e.assetId)
		)
	];
	if (!ids.length) return;
	const assets = await Asset.find({ _id: { $in: ids } })
		.select('contentType')
		.lean();
	for (const element of definition.elements) {
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
	if (kind === 'slide') await validateAssets(definition as SlideDefinition);
	else {
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
			if (kind === 'slide') await Slide.create({ ...update, version: 1, _createdById: userId });
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
export async function getPlayback(monitorId: string): Promise<Playback | null> {
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
		.select('published')
		.lean();
	const slides = playlist.published.items.flatMap((item) => {
		const slide = rows.find((row) => row._id.toString() === item.slideId);
		return slide?.published
			? [
					{
						id: slide._id.toString(),
						definition: slide.published,
						durationMs: item.durationMs ?? slide.published.durationMs
					}
				]
			: [];
	});
	if (!slides.length) return null;
	const content = {
		title: playlist.publishedTitle ?? 'Monitor playlist',
		loop: playlist.published.loop,
		slides
	};
	return {
		...content,
		version: createHash('sha256').update(JSON.stringify(content)).digest('hex')
	};
}
