import type { Actions } from './$types';
import { loadPostEditor, savePost, formActions } from '$lib/server/forms/posts';
export const load = ({ params }: { params: { _id: string } }) => loadPostEditor(params._id);
export const actions: Actions = {
	save: ({ request, locals, params }) => savePost(request, locals.user._id, params._id),
	...formActions
};
