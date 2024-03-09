import { getServerFunctions } from '$lib/dbTable';

const { actions, load } = await getServerFunctions('User', {
	columns: new Map([
		['isActive', { label: 'Active' }],
		['isOnboarded', { label: 'Onboarded' }]
	]),
	getRelationLabelFunctions: new Map([
		['profile', (row) => `${row.firstName} ${row.lastName}`],
		['roles', (row) => row.label]
	]),
	filteredColumns: ['passwordHash'],
	orderBy: [{ username: 'asc' }]
});

export { actions, load };
