import { fail } from '@sveltejs/kit';
import { listMonitors, revokeMonitor } from '$lib/server/monitors/sessions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ monitors: await listMonitors() });

// Employee authentication and role-based route access are enforced by the hook.
export const actions: Actions = {
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
