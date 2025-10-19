import { Post } from '$lib/server/mongoose/models';
import type { Actions } from '@sveltejs/kit';
import { Types } from 'mongoose';

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const { category, date, md, slug, title } = <Record<string, string>>(
			Object.fromEntries(await request.formData())
		);

		let sanitizedDate = new Date(date);
		sanitizedDate.setUTCHours(4, 0, 0, 0);

		await Post.create({
			_createdById: new Types.ObjectId(locals.user._id),
			category,
			date: sanitizedDate,
			md,
			slug,
			title
		});

		return {};
	}
};
