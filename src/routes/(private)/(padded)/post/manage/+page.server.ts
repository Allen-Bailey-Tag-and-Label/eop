import { Post } from '$lib/server/mongoose/models';
import { serverLoad } from '$lib/server/mongoose/serverLoad';

export const load = serverLoad({
	omitColumns: ['formIds', 'roleIds', 'content'],
	labelFunctionMap: new Map([
		[
			'User',
			(doc) => {
				return doc.username;
			}
		]
	]),
	model: Post
});
