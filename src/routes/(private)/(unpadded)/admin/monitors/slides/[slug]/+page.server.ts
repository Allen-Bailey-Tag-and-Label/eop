import { getEditor, listAssets, listSlideReferences } from '$lib/server/slides/content';
import { manageSlideEditor, saveEditor } from '$lib/server/slides/actions';
import { uploadAsset } from '$lib/server/slides/assets';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ params }) => {
	const slide = await getEditor('slide', params.slug);
	const [assets, references] = await Promise.all([listAssets(), listSlideReferences(slide.id)]);
	return { slide, assets, references };
};
export const actions: Actions = {
	save: ({ request, locals, params }) => saveEditor('slide', request, locals.user._id, params.slug),
	unpublish: ({ request, locals, params }) =>
		manageSlideEditor('unpublish', request, locals.user._id, params.slug),
	delete: ({ request, locals, params }) =>
		manageSlideEditor('delete', request, locals.user._id, params.slug),
	upload: ({ request, locals }) => uploadAsset(request, locals.user._id)
};
