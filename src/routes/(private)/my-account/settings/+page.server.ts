import { UserSettings } from '$lib/server/mongoose/models';
import type { Actions } from '@sveltejs/kit';
import { Types } from 'mongoose';

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const { magnification } = <{ magnification: string }>(
			Object.fromEntries(await request.formData())
		);

		await UserSettings.findOneAndUpdate(
			{ _id: locals.user.settings._id },
			{
				magnification: +magnification
			},
			{
				_createdById: new Types.ObjectId(locals.user._id),
				context: 'query'
			}
		);

		return {};
	}
};
