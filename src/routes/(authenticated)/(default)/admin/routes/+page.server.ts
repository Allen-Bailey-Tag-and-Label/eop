import { getLoadData } from '$lib/dbTable';

export const load = async () => {
	const dbTable = await getLoadData('Route', {
		columnOverrides: new Map([['roles', { getLabel: (row) => row.label }]])
	});
	return { dbTable };
};
