import { pageServer } from '$lib/prismaTable';

const { actions, load } = await pageServer({
	columnOrder: ['group', 'href', 'label', 'roleIds'],
	modelName: 'Route',
	sortKey: 'href'
});

export { actions, load };
