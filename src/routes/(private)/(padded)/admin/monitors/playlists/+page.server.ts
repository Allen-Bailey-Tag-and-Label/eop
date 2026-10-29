import { fail, redirect } from '@sveltejs/kit';
import { deletePlaylist, duplicatePlaylist, listPlaylists } from '$lib/server/slides/content';
import { SlideValidationError } from '$lib/slides/validation';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = async () => ({ playlists: await listPlaylists() });

export const actions: Actions = {
	duplicate: async ({ request, locals }) => {
		let key;
		try {
			key = await duplicatePlaylist(await request.formData(), locals.user._id);
		} catch (cause) {
			if (cause instanceof SlideValidationError)
				return fail(400, { error: cause.message, monitors: [] });
			throw cause;
		}
		redirect(303, `/admin/monitors/playlists/${key}`);
	},
	delete: async ({ request, locals }) => {
		try {
			const monitors = await deletePlaylist(await request.formData(), locals.user._id);
			if (monitors.length)
				return fail(409, {
					error: 'Reassign this playlist’s monitors in Monitor management before deleting it.',
					monitors
				});
			return { success: 'Playlist deleted.' };
		} catch (cause) {
			if (cause instanceof SlideValidationError)
				return fail(400, { error: cause.message, monitors: [] });
			throw cause;
		}
	}
};
