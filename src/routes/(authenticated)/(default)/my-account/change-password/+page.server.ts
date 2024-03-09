import bcrypt from 'bcryptjs';
import { dev } from '$app/environment';
import { prisma } from '$lib/prisma/index.js';
import { convert } from '$utilities';
import { fail, type Actions, redirect } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ cookies, locals, request }) => {
		// get form data
		const { currentPassword, newPassword, passwordConfirm } = <
			{ currentPassword: string; newPassword: string; passwordConfirm: string }
		>convert(await request.formData()).formData.to.Object();

		// check if passwords do not match
		if (newPassword !== passwordConfirm) return fail(400, { error: 'New passwords do not match' });

		// find user
		let user = await prisma.user.findFirst({ where: { username: locals.user.username } });

		// check if could not find user
		if (user === undefined || user === null) {
			cookies.set('session_id', '', {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: !dev,
				maxAge: 1
			});
			return redirect(303, '/sign-in');
		}

		// check if current password does not match
		if (!bcrypt.compareSync(currentPassword, user.passwordHash))
			return fail(400, { error: 'Current password does not match' });

		// generate passwordHash
		const passwordHash: string = await new Promise((res) => {
			bcrypt.hash(newPassword, 10, (err, hash) => {
				return res(hash);
			});
		});

		// update user
		user = await prisma.user.update({
			where: {
				username: locals.user.username
			},
			data: {
				passwordHash
			}
		});

		return { success: true };
	}
};
