import { getEditor, listAssets, listSlideReferences } from '$lib/server/slides/content';
import { manageSlideEditor, saveEditor } from '$lib/server/slides/actions';
import { uploadAsset } from '$lib/server/slides/assets';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { createSlideDataResolver } from '$lib/server/slides/data-sources';
import { parseJson, validateSlide, SlideValidationError } from '$lib/slides/validation';
export const load: PageServerLoad = async ({ params }) => {
	const slide = await getEditor('slide', params.slug);
	const [assets, references] = await Promise.all([listAssets(), listSlideReferences(slide.id)]);
	return { slide, assets, references };
};
export const actions: Actions = {
	preview: async ({ request }) => {
		try {
			const fields = await request.formData();
			const definition = validateSlide(parseJson(fields.get('definition')));
			return { slideData: await createSlideDataResolver()(definition) };
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
	upload: ({ request, locals }) => uploadAsset(request, locals.user._id)
};
