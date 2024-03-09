import { getServerFunctions } from '$lib/dbTable';

const { actions, load } = await getServerFunctions('UserProfile', {
	columns: new Map([]),
	columnOrder: ['First Name', 'Last Name', 'Email', 'Extension', 'User'],
	filteredColumns: ['dateHired', 'ennisId', 'emailSignatureTitle', 'userId'],
	getRelationLabelFunctions: new Map([['user', (row) => row.username]]),
	orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
});

export { actions, load };
