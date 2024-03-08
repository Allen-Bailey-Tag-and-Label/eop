import { getServerFunctions } from '$lib/dbTable';

const { actions, load } = await getServerFunctions('Role', {
	columns: new Map([]),
	getRelationLabelFunctions: new Map([
		['routes', (row) => row.href],
		['users', (row) => row.username]
	]),
	orderBy: []
});

export { actions, load };
