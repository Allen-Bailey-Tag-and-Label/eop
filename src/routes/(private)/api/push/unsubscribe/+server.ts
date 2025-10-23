import { UserSettings } from '$lib/server/mongoose/models';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals }) => {
	await UserSettings.findByIdAndUpdate(locals.user.settings._id, {
		notification: {
			isPermissionSet: true
		}
	});

	return new Response(null, { status: 201 });
};
