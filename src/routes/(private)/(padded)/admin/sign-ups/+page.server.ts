import { SignUp } from '$lib/server/mongoose/models';
import { serverLoad } from '$lib/server/mongoose/serverLoad';

export const load = serverLoad({
	labelFunctionMap: new Map([
		[
			'User',
			(doc) => {
				return doc.username;
			}
		]
	]),
	model: SignUp
});
