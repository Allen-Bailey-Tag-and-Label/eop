import { getServerFunctions } from '$lib/dbTable';

const { actions, load } = await getServerFunctions('UserProfile', {
	columns: new Map([]),
	getRelationLabelFunctions: new Map([['user', (row) => row.username]]),
	orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
});

export { actions, load };
