import { compareSync } from 'bcryptjs';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const actions: Actions = {
	default: async ({ cookies, request }) => {
		const { password, username }: { [key: string]: string } = <{ [key: string]: string }>(
			Object.fromEntries(await request.formData())
		);

		const user = await db.query.user.findFirst({
			where: (users, { eq }) => eq(users.username, username)
		});

		if (!user || !compareSync(password, user.passwordHash || '')) return fail(400);

		cookies.set('userId', user.id.toString(), { path: '/' });
		redirect(303, '/dashboard');
	}
};
