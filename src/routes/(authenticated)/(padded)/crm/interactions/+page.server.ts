import { pageServer } from '$lib/prismaTable';

const { actions, load } = await pageServer({
	columnOrder: ['customerId', 'date', 'typeId', 'result'],
	modelName: 'CRMInteraction',
	relationLabelFns: new Map([
		['customer', ({ label }) => label],
		['userProfile', ({ firstName, lastName }) => `${firstName} ${lastName}`]
	]),
	sortDirection: -1,
	sortKey: 'date'
});

export { actions, load };
