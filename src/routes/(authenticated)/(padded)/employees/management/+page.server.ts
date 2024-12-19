import { pageServer } from '$lib/prismaTable';

const { actions, load } = await pageServer({
	columnOrder: ['firstName', 'lastName'],
	modelName: 'UserProfile',
	relationLabelFns: new Map([
		['subordinates', ({ firstName, lastName }) => `${firstName} ${lastName}`],
		['supervisor', ({ firstName, lastName }) => `${firstName} ${lastName}`],
		['user', ({ username }) => username]
	]),
	sortKey: 'firstName'
});

export { actions, load };
