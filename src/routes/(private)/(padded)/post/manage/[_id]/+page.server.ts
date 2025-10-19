import { Post } from '$lib/server/mongoose/models';
import type { Actions } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request }) => {
		const { _id, category, date, md, slug, title } = <Record<string, string>>(
			Object.fromEntries(await request.formData())
		);

		let sanitizedDate = new Date(date);
		sanitizedDate.setUTCHours(4, 0, 0, 0);

		await Post.findByIdAndUpdate(_id, {
			category,
			date: sanitizedDate,
			md,
			slug,
			title
		});

		return {};
	}
};

export const load = async ({ params }) => {
	const post = await Post.findById(params._id);
	if (!post) redirect(303, '/post/manage');

	return {
		post: JSON.parse(JSON.stringify(post))
	};
};
