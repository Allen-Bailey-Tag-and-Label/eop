import { pageServer } from '$lib/prismaTable';

const { actions, load } = await pageServer({
	modelName: 'CRMInteraction',
	relationLabelFns: new Map([
		['customer', ({ label }) => label],
		['userProfile', ({ firstName, lastName }) => `${firstName} ${lastName}`]
	])
});

export { actions, load };
