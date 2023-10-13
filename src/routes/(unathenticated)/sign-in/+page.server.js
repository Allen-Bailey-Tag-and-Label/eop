import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import { JSONWEBTOKEN_SECRET } from '$env/static/private';
import { prisma } from '$lib/prisma';
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ cookies, request }) => {
		// get formData
		const { password, username } = Object.fromEntries(await request.formData());

		// find user
		const user = await prisma.user.findFirst({ where: { username } });

		// check if user does not exist
		if (user === null)
			return fail(400, {
				error: { username: true, message: 'Username does not exist' }
			});

		// check if password matches
		const passwordMatches = await new Promise((resolve) => {
			bcryptjs.compare(password, user.password, (err, result) => resolve(result));
		});

		if (!passwordMatches)
			return fail(400, {
				error: { password: true, username: true, message: 'Credentials do not match' }
			});

		// create token
		const token = jsonwebtoken.sign({ id: user.id }, JSONWEBTOKEN_SECRET);

		// save token to cookies
		cookies.set('token', token, { httpOnly: false, secure: false, path: '/' });

		throw redirect(303, '/dashboard');
	}
};
