import { Post } from '$lib/server/mongoose/models';
import { redirect } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const { year, month, day, slug } = <Record<string, string>>params;
	const date = new Date(`${year}-${month}-${day}`);
	date.setUTCHours(4, 0, 0, 0);

	const post = await Post.findOne({ date, slug }).populate({
		path: '_createdById',
		populate: { path: '_profileId' }
	});

	if (!post) redirect(303, '/');

	return JSON.parse(JSON.stringify(post));
};
