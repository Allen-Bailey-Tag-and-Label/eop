import { connect } from '$lib/server/mongoose';
import { Role, Route } from '$lib/server/mongoose/models';

export const load = async () => {
	await connect();

	return {
		routes: new Promise(async (res) => {
			const rows = await Route.find().lean();
			res(JSON.parse(JSON.stringify(rows)));
		}),
		rows: new Promise(async (res) => {
			const rows = await Role.find().populate('_createdById', 'username').lean();
			res(JSON.parse(JSON.stringify(rows)));
		})
	};
};
