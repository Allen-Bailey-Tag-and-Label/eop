import { pageServer } from '$lib/prismaTable';

const { actions, load } = await pageServer({
	columnOrder: ['label'],
	modelName: 'CRMInteractionType',
	sortKey: 'label'
});

export { actions, load };
