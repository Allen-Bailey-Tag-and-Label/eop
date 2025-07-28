import { User } from '$lib/server/mongoose/models';
import { fail, type Actions } from '@sveltejs/kit';
import { compareSync, hashSync } from 'bcryptjs';
import { Types } from 'mongoose';

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const { password, passwordConfirm, passwordCurrent } = <Record<string, string>>(
			Object.fromEntries(await request.formData())
		);

		if (password !== passwordConfirm)
			return fail(400, { error: 'Password (New) and Password (New Confirm) do not match.' });

		const user = await User.findOne({ _id: locals.user._id });
		if (!compareSync(passwordCurrent, user.passwordHash))
			return fail(400, { error: 'Password (Current) does not match.' });

		const passwordHash = hashSync(password);
		await User.findOneAndUpdate(
			{
				_id: locals.user._id
			},
			{
				passwordHash
			},
			{
				_createdById: new Types.ObjectId(locals.user._id),
				context: 'query'
			}
		);

		return {};
	}
};
