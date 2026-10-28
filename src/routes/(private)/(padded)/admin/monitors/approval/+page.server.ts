import { fail } from '@sveltejs/kit';
import { approveMonitor } from '$lib/server/monitors/sessions';
import type { Actions } from './$types';

// Employee authentication and role-based route access are enforced by the hook.
export const actions: Actions = {
	approve: async ({ request, locals }) => {
		const fields = await request.formData();
		const code = fields.get('code');
		const location = fields.get('location');
		const monitor = await approveMonitor(code, location, locals.user._id);
		if (!monitor) {
			return fail(400, {
				error:
					'Enter a current monitor code and a location description between 2 and 160 characters.',
				code: typeof code === 'string' ? code : '',
				location: typeof location === 'string' ? location : ''
			});
		}
		return { success: `Monitor approved for ${monitor.location}.` };
	}
};
