import { getLoadData } from '$lib/dbTable';

export const load = async () => {
	const dbTable = await getLoadData('Role', {
		columnOverrides: new Map([
			['routes', { getLabel: (row) => row.href }],
			['users', { getLabel: (row) => `${row.username}` }]
		])
	});
	return { dbTable };
};
