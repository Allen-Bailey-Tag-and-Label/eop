import bcrypt from 'bcryptjs';
import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { prisma } from '$lib/prisma';
import { convert } from '$utilities';
import type { Actions } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ cookies, request }) => {
		let defaultRole, user;
		try {
			// get password and email from request
			const { password, email } = <{ password: string; email: string }>(
				convert(await request.formData()).formData.to.Object()
			);

			// generate passwordHash
			const passwordHash: string = await new Promise((res) => {
				bcrypt.hash(password, 10, (err, hash) => {
					return res(hash);
				});
			});

			try {
				// get default role
				defaultRole = await prisma.role.findFirst({ where: { label: 'default' } });
				if (defaultRole === undefined || defaultRole === null) throw 'Missing default role';
			} catch (error) {
				throw 'Missing default role';
			}

			try {
				// create user
				user = await prisma.user.create({
					data: { email, isActive: true, passwordHash, roleIds: [defaultRole.id] }
				});
			} catch (error) {
				throw 'Email already exists.  Please sign in.';
			}

			// set session_id cookie
			cookies.set('session_id', user.id, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: !dev,
				maxAge: 60 * 60 * 24 * 7
			});
		} catch (error) {
			console.log(error);
			return fail(401, { error });
		}
		throw redirect(303, '/onboard');
	}
};
