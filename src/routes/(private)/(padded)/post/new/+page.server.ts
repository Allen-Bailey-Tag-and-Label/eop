import type { Actions } from './$types';
import { loadPostEditor, savePost, formActions } from '$lib/server/forms/posts';
export const load = () => loadPostEditor();
export const actions: Actions = {
	save: ({ request, locals }) => savePost(request, locals.user._id),
	...formActions
};
