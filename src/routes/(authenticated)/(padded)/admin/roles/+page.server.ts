import { pageServer } from '$lib/prismaTable';

const { actions, load } = await pageServer({
	modelName: 'Role',
	relationLabelFns: new Map([['users', (user) => user.username]])
});

export { actions, load };
