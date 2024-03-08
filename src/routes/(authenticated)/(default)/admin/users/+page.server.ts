import { getServerFunctions } from '$lib/dbTable';

const { actions, load } = await getServerFunctions('User', {
	columns: new Map([]),
	getRelationLabelFunctions: new Map([
		['profile', (row) => `${row.firstName} ${row.lastName}`],
		['roles', (row) => row.label]
	]),
	filteredColumns: [
		'aesFeatureEnterIds',
		'aesFeatureEnters',
		'aesFeatureModifyIds',
		'aesFeatureModifys',
		'passwordHash'
	],
	orderBy: [{ username: 'asc' }]
});

export { actions, load };
