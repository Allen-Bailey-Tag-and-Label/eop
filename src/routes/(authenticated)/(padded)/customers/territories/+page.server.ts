import { pageServer } from '$lib/prismaTable';

const { actions, load } = await pageServer({
	modelName: 'CustomerTerritory',
	relationLabelFns: new Map([['createdBy', ({ username }) => username]]),
	sortKey: 'label'
});

export { actions, load };
