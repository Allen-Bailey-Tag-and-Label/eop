import { Role } from '$lib/server/mongoose/models';
import { serverLoad } from '$lib/server/mongoose/serverLoad';

export const load = serverLoad({
	labelFunctionMap: new Map([
		[
			'Route',
			(doc) => {
				if (doc.isDirectory) return doc.label;
				return `${doc.href}`;
			}
		],
		[
			'User',
			(doc) => {
				return doc.username;
			}
		]
	]),
	model: Role
});
