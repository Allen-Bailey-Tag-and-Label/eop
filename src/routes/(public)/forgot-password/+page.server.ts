import { User, UserPasswordReset } from '$lib/server/mongoose/models';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { compareSync, hashSync } from 'bcryptjs';

export const actions: Actions = {
	'reset-password': async ({ cookies, request }) => {
		const { password, passwordConfirm, username } = <
			{ password: string; passwordConfirm: string; username: string }
		>Object.fromEntries(await request.formData());

		if (password !== passwordConfirm) return fail(400, { error: 'Passwords do not match.' });

		const passwordHash = hashSync(password);
		await Promise.all([
			User.findOneAndUpdate({ username }, { passwordHash }),
			UserPasswordReset.deleteMany({ username })
		]);

		const user = await User.findOne({ username }).lean();

		if (!user || !user?.passwordHash || !compareSync(password, user.passwordHash))
			return fail(400, { error: 'Could not verify credentials' });

		cookies.set('userId', user._id.toString(), { path: '/' });
		redirect(303, '/dashboard');
	},
	'verify-code': async ({ request }) => {
		const { code, username } = <{ code: string; username: string }>(
			Object.fromEntries(await request.formData())
		);

		const userPasswordResetRequest = await UserPasswordReset.findOne({ username }).lean();

		if (userPasswordResetRequest === null)
			return fail(400, { error: 'Could not find password reset request.' });
		if (!compareSync(code, userPasswordResetRequest.codeHash))
			return fail(400, { error: 'Incorrect code provided.' });

		return { message: 'Code confirmed.  Please enter in your new password.', username };
	}
};
