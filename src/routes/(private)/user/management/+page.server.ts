import { connect } from '$lib/server/mongoose';
import { User } from '$lib/server/mongoose/models';

export const load = async () => {
	await connect();

	return {
		rows: new Promise(async (res) => {
			const rows = await User.find();
			res(JSON.parse(JSON.stringify(rows)));
		})
	};
};
