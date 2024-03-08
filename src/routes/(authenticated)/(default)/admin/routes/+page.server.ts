import { getServerFunctions } from '$lib/dbTable';

const { actions, load } = await getServerFunctions('Route', {
	columns: new Map([]),
	getRelationLabelFunctions: new Map([['roles', (row) => row.label]]),
	orderBy: []
});

export { actions, load };
