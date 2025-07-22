import { hashSync } from 'bcryptjs';
import { connect } from '$lib/server/mongoose';
import { Role, User } from '$lib/server/mongoose/models';

const seed = async () => {
	await User.deleteMany();

	const admin = await Role.findOne({ label: 'admin' });
	if (!admin) return;
	const [bmcaleavey] = await User.insertMany([
		{
			username: 'bmcaleavey',
			passwordHash: hashSync('Superma3+', 10),
			isActive: true,
			roles: [admin._id]
		}
	]);
};

export const load = async () => {
	await connect();
	// await seed();

	return {
		rows: new Promise(async (res) => {
			const rows = await User.find();
			res(JSON.parse(JSON.stringify(rows)));
		})
	};
};
