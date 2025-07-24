import { connect } from '$lib/server/mongoose';
import { Route } from '$lib/server/mongoose/models';

export const load = async () => {
	await connect();

	return {
		rows: new Promise(async (res) => {
			const rows = await Route.find().populate('_createdById', 'username').lean();
			res(JSON.parse(JSON.stringify(rows)));
		})
	};
};
