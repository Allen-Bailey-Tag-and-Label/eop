import { Branch } from '$lib/server/mongoose/models';

export const load = async () => {
	return {
		branches: new Promise(async (res) => {
			const branches = await Branch.find()
				.populate('_createdById', 'username')
				.sort({ number: 1 })
				.lean();
			res(JSON.parse(JSON.stringify(branches)));
		})
	};
};
