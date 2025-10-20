import { Post } from '$lib/server/mongoose/models';
import { redirect } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const { year, month, day, slug } = <Record<string, string>>params;

	const post = await Post.findOne({ day: +day, month: +month, slug, year: +year }).populate({
		path: '_createdById',
		populate: { path: '_profileId' }
	});

	if (!post) redirect(303, '/');

	return JSON.parse(JSON.stringify(post));
};
