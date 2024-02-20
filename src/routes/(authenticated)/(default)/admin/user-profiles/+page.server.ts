import { getLoadData } from '$lib/dbTable';

export const load = async () => {
	const dbTable = await getLoadData('UserProfile', {
		columnOverrides: new Map([['user', { getLabel: (row) => row.username }]])
	});
	return { dbTable };
};
