import { getEditor, listAssets } from '$lib/server/slides/content';
import { saveEditor } from '$lib/server/slides/actions';
import { uploadAsset } from '$lib/server/slides/assets';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ params }) => ({
	slide: await getEditor('slide', params.slug),
	assets: await listAssets()
});
export const actions: Actions = {
	save: ({ request, locals, params }) => saveEditor('slide', request, locals.user._id, params.slug),
	upload: ({ request, locals }) => uploadAsset(request, locals.user._id)
};
