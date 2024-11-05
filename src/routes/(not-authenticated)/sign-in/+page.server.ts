import { default as bcrypt } from 'bcryptjs';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import { dev } from '$app/environment';

export const actions: Actions = {
	default: async ({ cookies, request }) => {
		const { username, password } = <Record<string, string>>(
			Object.fromEntries(await request.formData())
		);

		const user = await prisma.user.findUnique({
			where: { username: username.toLowerCase().trim() }
		});

		// check if user doesn't exist
		if (!user)
			return fail(403, {
				error: {
					inputClasses: { username: 'ring-offset-red-500 dark:ring-offset-red-500' },
					message: 'Username does not exist'
				}
			});

		// check if user is not active
		if (!user.active)
			return fail(403, {
				error: {
					inputClasses: { username: 'ring-offset-red-500 dark:ring-offset-red-500' },
					message: 'Username is not active'
				}
			});

		// check if password does not match
		if (!bcrypt.compareSync(password, user.passwordHash))
			return fail(403, {
				error: {
					inputClasses: { password: 'ring-offset-red-500 dark:ring-offset-red-500' },
					message: 'Password is incorrect'
				}
			});

		// update userId cookie
		cookies.set('userId', user.id, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: !dev,
			maxAge: 60 * 60 * 24 * 7 // 1 week
		});

		throw redirect(303, '/dashboard');
	}
};
