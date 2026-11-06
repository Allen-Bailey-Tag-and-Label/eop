import { fail } from '@sveltejs/kit';
import {
	listMonitors,
	revokeMonitor,
	setMonitorColorMode,
	requestMonitorRefresh,
	requestMonitorNavigation
} from '$lib/server/monitors/sessions';
import { assignPlaylist, listPlaylists } from '$lib/server/slides/content';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [monitors, playlists] = await Promise.all([listMonitors(), listPlaylists()]);
	return { monitors, playlists: playlists.filter((playlist) => playlist.publishedAt) };
};

// Employee authentication and role-based route access are enforced by the hook.
export const actions: Actions = {
	navigate: async ({ request }) => {
		const fields = await request.formData();
		if (
			!(await requestMonitorNavigation(
				fields.get('sessionId'),
				fields.get('direction'),
				fields.get('playlistId')
			))
		)
			return fail(400, {
				error:
					'Could not queue navigation. Choose an approved monitor with an assigned playlist, or refresh the management page and try again.'
			});
		return {
			success:
				'Slide change queued. Online displays normally receive it within two seconds; offline displays receive it when they reconnect.'
		};
	},
	refresh: async ({ request }) => {
		const fields = await request.formData();
		if (!(await requestMonitorRefresh(fields.get('sessionId'))))
			return fail(400, { error: 'Choose an approved monitor to refresh.' });
		return {
			success:
				'Refresh requested. This monitor will reload on its next status check, normally within two seconds. Offline monitors receive it when they reconnect.'
		};
	},
	colorMode: async ({ request }) => {
		const fields = await request.formData();
		if (!(await setMonitorColorMode(fields.get('sessionId'), fields.get('colorMode'))))
			return fail(400, { error: 'Choose an approved monitor and a valid color mode.' });
		return {
			success: 'Monitor color mode saved. The display receives it on its next content check.'
		};
	},
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
