import { prisma } from '$lib/prisma';
import { fail } from '@sveltejs/kit';

export const actions = {
	default: async ({ request }) => {
		// get formData
		const { username } = Object.fromEntries(await request.formData());

		// find user
		const user = await prisma.user.findFirst({ where: { username } });

		// check if user doesn't exist
		if (user === null)
			return fail(400, { error: { username: true, message: "Username doesn't exist" } });

		// check if reset request already exists
		const resetRequest = await prisma.userPasswordResetRequest.findFirst({
			where: { userId: user.id }
		});

		if (resetRequest !== null)
			return fail(400, {
				error: {
					username: true,
					message:
						'Password reset already received.  Please wait for an update from an administrator.'
				}
			});

		// create password request
		await prisma.userPasswordResetRequest.create({ data: { userId: user.id } });

		return { success: true };
	}
};
