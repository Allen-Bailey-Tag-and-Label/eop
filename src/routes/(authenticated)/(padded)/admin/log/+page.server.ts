import { pageServer } from '$lib/prismaTable';

const { actions, load } = await pageServer({
	isCreatable: false,
	modelName: 'Log',
	relationLabelFns: new Map([['user', ({ username }) => username]]),
	sortDirection: -1,
	sortKey: 'createdAt'
});

export { actions, load };
