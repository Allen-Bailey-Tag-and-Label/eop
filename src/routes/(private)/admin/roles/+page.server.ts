import { connect } from '$lib/server/mongoose';
import { Role } from '$lib/server/mongoose/models';

const seed = async () => {
	await Role.deleteMany();

	const [admin] = await Role.insertMany([{ label: 'admin' }]);
};

export const load = async () => {
	await connect();
	// await seed();

	return {
		rows: new Promise(async (res) => {
			const rows = await Role.find();
			res(JSON.parse(JSON.stringify(rows)));
		})
	};
};
