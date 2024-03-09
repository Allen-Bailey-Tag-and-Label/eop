import { getServerFunctions } from '$lib/dbTable';

const { actions, load } = await getServerFunctions('UserProfile', {
	columns: new Map([]),
	columnOrder: [
		'First Name',
		'Last Name',
		'Ennis Id',
		'Email',
		'Extension',
		'Date Hired',
		'Email Signature Title',
		'User'
	],
	getRelationLabelFunctions: new Map([['user', (row) => row.username]]),
	orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
});

export { actions, load };
