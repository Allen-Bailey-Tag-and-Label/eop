import { getServerFunctions } from '$lib/dbTable';

const { actions, load } = await getServerFunctions('Route', {
	columns: new Map([['roles', { label: 'Roles' }]]),
	getRelationLabelFunctions: new Map([['roles', (row) => row.label]]),
	orderBy: []
});

export { actions, load };
