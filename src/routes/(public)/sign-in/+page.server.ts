import { fail, redirect, type Actions } from '@sveltejs/kit';
import { compareSync } from 'bcryptjs';
import { User } from '$lib/server/mongoose/models';
import { connect } from '$lib/server/mongoose';

export const actions: Actions = {
	default: async ({ cookies, request }) => {
		await connect();

		const { password, username }: { [key: string]: string } = <{ [key: string]: string }>(
			Object.fromEntries(await request.formData())
		);

		const user = await User.findOne({ username }).lean();

		if (!user || !user?.passwordHash || !compareSync(password, user.passwordHash))
			return fail(400, { error: 'Could not verify credentials' });

		cookies.set('userId', user._id.toString(), { path: '/' });
		redirect(303, '/dashboard');
	}
};
