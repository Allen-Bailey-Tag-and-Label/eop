import { getEditor, listSlides } from '$lib/server/slides/content';
import { saveEditor } from '$lib/server/slides/actions';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ params }) => ({
	playlist: await getEditor('playlist', params.slug),
	slides: await listSlides()
});
export const actions: Actions = {
	save: ({ request, locals, params }) =>
		saveEditor('playlist', request, locals.user._id, params.slug)
};
