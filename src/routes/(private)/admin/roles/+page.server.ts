import { connect } from '$lib/server/mongoose';
import { Role } from '$lib/server/mongoose/models';

export const load = async () => {
	await connect();

	return {
		rows: new Promise(async (res) => {
			const rows = await Role.find();
			res(JSON.parse(JSON.stringify(rows)));
		})
	};
};
