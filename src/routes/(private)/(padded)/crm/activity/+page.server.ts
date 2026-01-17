import { CustomerActivity } from '$lib/server/mongoose/models';
import { serverLoad } from '$lib/server/mongoose/serverLoad';

export const load = serverLoad({
	labelFunctionMap: new Map([
		['CustomerContact', (doc) => `${doc.firstName} ${doc.lastName}`],
		[
			'User',
			(doc) => {
				return doc.username;
			}
		]
	]),
	model: CustomerActivity,
	omitColumns: ['_id']
});
