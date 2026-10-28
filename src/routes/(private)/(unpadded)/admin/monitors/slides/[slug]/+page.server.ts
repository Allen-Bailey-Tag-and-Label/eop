import { Types } from 'mongoose';
import { redirect } from '@sveltejs/kit';
import { assetScope, listAssetLibrary, manageAsset } from '$lib/server/slides/asset-library';
import { getEditor, listSlideReferences } from '$lib/server/slides/content';
import { manageSlideEditor, saveEditor } from '$lib/server/slides/actions';
import { uploadAsset } from '$lib/server/slides/assets';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { previewSlideData, getDataFields } from '$lib/server/slides/data-sources';
import { parseJson, SlideValidationError } from '$lib/slides/validation';
export const load: PageServerLoad = async ({ params, url }) => {
	if (params.slug === 'new' && !/^[a-f0-9]{24}$/i.test(url.searchParams.get('assetScope') ?? ''))
		redirect(303, `/admin/monitors/slides/new?assetScope=${new Types.ObjectId()}`);
	const slide = await getEditor('slide', params.slug);
	const assetScopeId = slide.id || url.searchParams.get('assetScope')!;
	const [library, references] = await Promise.all([
		listAssetLibrary(assetScopeId),
		listSlideReferences(slide.id)
	]);
	return { slide, ...library, references, assetScopeId, dataFields: await getDataFields() };
};
export const actions: Actions = {
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
