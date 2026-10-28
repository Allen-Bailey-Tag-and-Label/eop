import { fail } from '@sveltejs/kit';
import { listMonitors, revokeMonitor } from '$lib/server/monitors/sessions';
import { assignPlaylist, listPlaylists } from '$lib/server/slides/content';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [monitors, playlists] = await Promise.all([listMonitors(), listPlaylists()]);
	return { monitors, playlists: playlists.filter((playlist) => playlist.publishedAt) };
};

// Employee authentication and role-based route access are enforced by the hook.
export const actions: Actions = {
	assign: async ({ request }) => {
		const fields = await request.formData();
		if (!(await assignPlaylist(fields.get('sessionId'), fields.get('playlistId'))))
			return fail(400, { error: 'Choose an approved monitor and a published playlist.' });
		return { success: 'Playlist assignment saved. The monitor updates between slides.' };
	},
	revoke: async ({ request }) => {
		const fields = await request.formData();
		if (!(await revokeMonitor(fields.get('sessionId')))) {
			return fail(400, {
				error: 'That monitor session could not be revoked. Refresh and try again.'
			});
		}
		return {
			success: 'Monitor access revoked. It will return to the pairing screen on its next check.'
		};
	}
};
