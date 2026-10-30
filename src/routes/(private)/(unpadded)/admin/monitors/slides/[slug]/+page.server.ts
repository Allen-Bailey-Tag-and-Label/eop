import { Types } from 'mongoose';
import { redirect } from '@sveltejs/kit';
import { assetScope, listAssetLibrary, manageAsset } from '$lib/server/slides/asset-library';
import { getEditor, listSlideReferences } from '$lib/server/slides/content';
import { manageSlideEditor, saveEditor } from '$lib/server/slides/actions';
import { uploadAsset } from '$lib/server/slides/assets';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { previewSlideData } from '$lib/server/slides/data-sources';
import {
	sourceOptions,
	listSources,
	listConnections,
	getSource,
	sourceUsage,
	saveSource,
	deleteSource,
	moveSource,
	previewWorkflow,
	saveConnection,
	deleteConnection
} from '$lib/server/data/sources';
import { DataWorkflowError } from '$lib/data/types';
import { allElements, collectionReference } from '$lib/slides/repeater';
import { extractLegacyLinks } from '$lib/server/data/legacy-links';
import { parseJson, SlideValidationError } from '$lib/slides/validation';
export const config = { maxDuration: 30 };
export const load: PageServerLoad = async ({ params, url, locals }) => {
	if (params.slug === 'new' && !/^[a-f0-9]{24}$/i.test(url.searchParams.get('assetScope') ?? ''))
		redirect(303, `/admin/monitors/slides/new?assetScope=${new Types.ObjectId()}`);
	const slide = await getEditor('slide', params.slug);
	const assetScopeId = slide.id || url.searchParams.get('assetScope')!;
	slide.draft = await extractLegacyLinks(slide.draft, assetScopeId, locals.user._id);
	const [library, references] = await Promise.all([
		listAssetLibrary(assetScopeId),
		listSlideReferences(slide.id)
	]);
	return {
		slide,
		...library,
		references,
		assetScopeId,
		sources: await sourceOptions(
			assetScopeId,
			allElements(slide.draft).flatMap((element) =>
				[element.dataReference?.sourceId, collectionReference(element)?.sourceId].filter(
					(id): id is string => !!id
				)
			)
		),
		dataSources: await listSources(assetScopeId),
		dataConnections: await listConnections()
	};
};
async function dataAction(event: Parameters<NonNullable<Actions[string]>>[0], operation: string) {
	try {
		const fields = await event.request.formData();
		const scope = await assetScope(event.params.slug, fields.get('assetScopeId'));
		const actor = event.locals.user._id;
		if (operation === 'migrate')
			return {
				definition: await extractLegacyLinks(
					(await import('$lib/slides/validation')).validateSlide(
						parseJson(fields.get('definition'))
					),
					scope,
					actor
				)
			};
		if (operation === 'preview') {
			if (
				String(fields.get('definition') ?? '').length > 200000 ||
				String(fields.get('parameters') ?? '').length > 10000
			)
				throw new DataWorkflowError('Preview input is too large.');
			const id = String(fields.get('id') ?? '');
			if (id) await getSource(id, scope);
			return {
				preview: await previewWorkflow(
					JSON.parse(String(fields.get('definition') ?? '{}')),
					JSON.parse(String(fields.get('parameters') ?? '{}'))
				)
			};
		}
		if (operation === 'connectionSave') {
			await saveConnection(fields, actor);
			return { success: 'API connection saved.' };
		}
		if (operation === 'connectionDelete') {
			await deleteConnection(fields, actor);
			return { success: 'API connection deleted.' };
		}
		let id = String(fields.get('id') ?? '');
		if (operation === 'save') id = await saveSource(fields, actor, scope);
		if (operation === 'delete') {
			await deleteSource(fields, actor, scope);
			return { deleted: true };
		}
		if (operation === 'manage') {
			if (fields.get('operation') === 'delete') {
				await deleteSource(fields, actor, scope);
				return { deleted: true };
			}
			if (fields.get('operation') === 'move') {
				await moveSource(fields, scope, actor);
				return { success: 'Data link moved.' };
			}
			if (fields.get('operation') !== 'get') throw new DataWorkflowError('Unknown data action.');
		}
		return {
			source: await getSource(id, scope),
			usage: await sourceUsage(id),
			...(operation === 'save' ? { success: 'Data link saved.' } : {})
		};
	} catch (cause) {
		if (
			cause instanceof DataWorkflowError ||
			cause instanceof SlideValidationError ||
			cause instanceof SyntaxError
		)
			return fail(400, { error: cause.message });
		throw cause;
	}
}
export const actions: Actions = {
	dataMigrate: (event) => dataAction(event, 'migrate'),
	dataSave: (event) => dataAction(event, 'save'),
	dataDelete: (event) => dataAction(event, 'delete'),
	dataPreview: (event) => dataAction(event, 'preview'),
	dataManage: (event) => dataAction(event, 'manage'),
	connectionSave: (event) => dataAction(event, 'connectionSave'),
	connectionDelete: (event) => dataAction(event, 'connectionDelete'),
	preview: async ({ request }) => {
		try {
			const fields = await request.formData();
			return { slideData: await previewSlideData(parseJson(fields.get('definition'))) };
		} catch (cause) {
			if (cause instanceof SlideValidationError) return fail(400, { error: cause.message });
			throw cause;
		}
	},
	save: ({ request, locals, params }) => saveEditor('slide', request, locals.user._id, params.slug),
	unpublish: ({ request, locals, params }) =>
		manageSlideEditor('unpublish', request, locals.user._id, params.slug),
	delete: ({ request, locals, params }) =>
		manageSlideEditor('delete', request, locals.user._id, params.slug),
	asset: async ({ request, locals, params }) => {
		try {
			const fields = await request.formData();
			const scope = await assetScope(params.slug, fields.get('assetScopeId'));
			return await manageAsset(fields, scope, locals.user._id);
		} catch (cause) {
			if (cause instanceof SlideValidationError) return fail(400, { error: cause.message });
			throw cause;
		}
	},
	upload: ({ request, locals, params }) => uploadAsset(request, locals.user._id, params.slug)
};
