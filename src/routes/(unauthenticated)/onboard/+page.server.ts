import { fail, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import { convert } from '$utilities';
import type { Actions } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ locals, request }) => {
		try {
			// get firstName and lastName from request
			const { firstName, lastName } = <{ firstName: string; lastName: string }>(
				convert(await request.formData()).formData.to.Object()
			);

			// create user profile
			await prisma.userProfile.create({
				data: {
					firstName,
					lastName,
					userId: locals.user.id
				}
			});

			// update user isOnboarded key
			await prisma.user.update({
				where: {
					id: locals.user.id
				},
				data: {
					isOnboarded: true
				}
			});
		} catch (error) {
			return fail(401, { error: 'Could not update your profile' });
		}
		throw redirect(303, '/dashboard');
	}
};
