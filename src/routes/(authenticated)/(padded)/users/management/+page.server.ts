import { pageServer } from '$lib/prismaTable';

const { actions, load } = await pageServer({
	modelName: 'User',
	sortKey: 'username'
});

export { actions, load };
