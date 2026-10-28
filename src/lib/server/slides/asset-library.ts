import { Types } from 'mongoose';
import { Asset, Slide } from './models';
import { allElements } from '$lib/slides/repeater';
import type { AssetSummary, SlideDefinition } from '$lib/slides/types';
import { isId, SlideValidationError } from '$lib/slides/validation';

export async function assetReferences() {
	const slides = await Slide.find()
		.select(
			'slug title draft.elements.assetId draft.elements.repeater.template.elements.assetId published.elements.assetId published.elements.repeater.template.elements.assetId'
		)
		.lean();
	const uses = new Map<string, Set<string>>();
	for (const slide of slides) {
		for (const definition of [slide.draft, slide.published]) {
			if (!definition?.elements) continue;
			for (const element of allElements(definition)) {
				if (!isId(element.assetId)) continue;
				const owners = uses.get(element.assetId) ?? new Set<string>();
				owners.add(slide._id.toString());
				uses.set(element.assetId, owners);
			}
		}
	}
	return { uses, slides };
}

// Classify legacy records once without changing their IDs, bytes, or slide references.
// The conditional writes make concurrent first loads safe and preserve explicit choices.
export async function reconcileAssetScopes() {
	const legacy = await Asset.find({ scope: { $exists: false } })
		.select('_id')
		.lean();
	if (!legacy.length) return;
	const { uses } = await assetReferences();
	await Asset.bulkWrite(
		legacy.map((asset) => {
			const owners = [...(uses.get(asset._id.toString()) ?? [])];
			return {
				updateOne: {
					filter: { _id: asset._id, scope: { $exists: false } },
					update: {
						$set:
							owners.length === 1
								? { scope: 'slide', slideId: new Types.ObjectId(owners[0]) }
								: { scope: owners.length ? 'shared' : 'unassigned' }
					}
				}
			};
		})
	);
}

export async function assetScope(slug: string, proposed: unknown) {
	if (slug === 'new') {
		if (!isId(proposed))
			throw new SlideValidationError('Reload the editor before uploading assets.');
		if (await Slide.exists({ _id: proposed }))
			throw new SlideValidationError('This draft ID is already saved. Open the saved slide.');
		return proposed;
	}
	const slide = await Slide.findOne({ slug }).select('_id').lean();
	if (!slide) throw new SlideValidationError('This slide no longer exists.');
	return slide._id.toString();
}

export async function listAssetLibrary(slideId: string) {
	await reconcileAssetScopes();
	const { uses, slides } = await assetReferences();
	const referenced = [...uses].filter(([, owners]) => owners.has(slideId)).map(([id]) => id);
	const query = (filter: Record<string, unknown>) =>
		Asset.find(filter)
			.select('name contentType scope slideId')
			.sort({ updatedAt: -1 })
			.limit(500)
			.lean();
	const [owned, shared, unused, referencedAssets] = await Promise.all([
		query({ $or: [{ scope: 'slide', slideId }, { _id: { $in: referenced } }] }),
		query({ scope: 'shared' }),
		query({ scope: { $in: ['slide', 'unassigned'] }, _id: { $nin: [...uses.keys()] } }),
		query({ _id: { $in: referenced } })
	]);
	const summarize = (rows: typeof owned): AssetSummary[] =>
		rows.map((row) => ({
			id: row._id.toString(),
			name: row.name,
			contentType: row.contentType,
			scope: row.scope,
			slideId: row.slideId?.toString()
		}));
	return {
		assets: summarize([
			...new Map([...owned, ...referencedAssets].map((row) => [row._id.toString(), row])).values()
		]),
		sharedAssets: summarize(shared),
		unusedAssets: summarize(unused),
		assetSlides: slides
			.map((slide) => ({ id: slide._id.toString(), title: slide.title, slug: slide.slug }))
			.sort((a, b) => a.title.localeCompare(b.title))
	};
}

export async function manageAsset(fields: FormData, currentSlideId: string, userId: string) {
	await reconcileAssetScopes();
	const id = fields.get('assetId');
	const operation = fields.get('operation');
	if (!isId(id) || !['share', 'copy', 'assign'].includes(String(operation)))
		throw new SlideValidationError('Choose an asset and action.');
	const { uses } = await assetReferences();
	const asset = await Asset.findById(id).select('+data');
	if (!asset) throw new SlideValidationError('This asset no longer exists.');
	const owned = asset.scope === 'slide' && asset.slideId?.toString() === currentSlideId;
	const unused = !uses.get(id)?.size;
	if (!(owned || asset.scope === 'shared' || uses.get(id)?.has(currentSlideId) || unused))
		throw new SlideValidationError('Open the slide that owns this asset to share or copy it.');
	if (operation === 'copy') {
		const target = fields.get('targetSlideId') || currentSlideId;
		if (!isId(target) || (target !== currentSlideId && !(await Slide.exists({ _id: target }))))
			throw new SlideValidationError('Choose a destination slide.');
		const copy = await Asset.create({
			name: asset.name,
			contentType: asset.contentType,
			data: asset.data,
			scope: 'slide',
			slideId: new Types.ObjectId(target),
			_createdById: userId
		});
		return { success: 'Asset copied to the destination slide.', assetId: copy._id.toString() };
	}
	if (operation === 'assign' && !(asset.scope === 'unassigned' && unused))
		throw new SlideValidationError(
			'Only unassigned, unused assets can be moved. Copy this asset instead.'
		);
	if (
		operation === 'share' &&
		!(owned || asset.scope === 'shared' || (asset.scope === 'unassigned' && unused))
	)
		throw new SlideValidationError('Open the owning slide to share this asset.');
	const change =
		operation === 'share'
			? { $set: { scope: 'shared' }, $unset: { slideId: 1 } }
			: { $set: { scope: 'slide', slideId: new Types.ObjectId(currentSlideId) } };
	const changed = await Asset.updateOne(
		{ _id: id, scope: asset.scope, slideId: asset.slideId ?? { $exists: false } },
		change
	);
	if (!changed.modifiedCount && asset.scope !== 'shared')
		throw new SlideValidationError('This asset changed. Reload the library.');
	return {
		success:
			operation === 'share' ? 'Asset added to the shared library.' : 'Asset assigned to this slide.'
	};
}

export async function validateAssetScope(definition: SlideDefinition, slideId: string) {
	const ids = [
		...new Set(
			allElements(definition)
				.filter((element) => element.type === 'image' || element.type === 'svg')
				.map((element) => element.assetId)
		)
	];
	if (!ids.length) return;
	await reconcileAssetScopes();
	const rows = await Asset.find({ _id: { $in: ids } })
		.select('scope slideId')
		.lean();
	const { uses } = await assetReferences();
	if (
		rows.some(
			(asset) =>
				asset.scope !== 'shared' &&
				asset.slideId?.toString() !== slideId &&
				!uses.get(asset._id.toString())?.has(slideId)
		)
	)
		throw new SlideValidationError('Copy the asset to this slide or share it before using it.');
}
