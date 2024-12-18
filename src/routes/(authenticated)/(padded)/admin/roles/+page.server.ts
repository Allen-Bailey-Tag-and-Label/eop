import { pageServer } from '$lib/prismaTable';

const { actions, load } = await pageServer({
	modelName: 'Role',
	relationLabelFns: new Map([
		['routes', (route) => `${route.group !== '' ? `${route.group} - ` : ''}${route.label}`],
		['users', (user) => user.username]
	])
});

export { actions, load };
