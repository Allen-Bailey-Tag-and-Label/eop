import { getLoadData } from '$lib/dbTable';

export const load = async () => {
	const dbTable = await getLoadData('User', {
		columnOverrides: new Map([
			['profile', { isEditable: false, getLabel: (row) => `${row.firstName} ${row.lastName}` }],
			['roles', { getLabel: (row) => row.label }]
		]),
		fieldFilterNames: ['passwordHash'],
		findManyParamaters: {
			orderBy: [{ username: 'asc' }]
		}
	});
	return { dbTable };
};
