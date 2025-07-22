import { connect } from '$lib/server/mongoose';
import { Route } from '$lib/server/mongoose/models';

const seed = async () => {
	await Route.deleteMany();

	const [admin, dashboard, ups] = await Route.insertMany([
		{ isDirectory: true, label: 'Admin' },
		{ href: 'dashboard', label: 'Dashboard' },
		{ isDirectory: true, label: 'UPS' }
	]);
	await Route.insertMany([
		{ href: 'admin/roles', label: 'Roles', parentId: admin._id },
		{ href: 'admin/routes', label: 'Routes', parentId: admin._id },
		{ href: 'admin/seed', label: 'Seed', parentId: admin._id }
	]);
	await Route.insertMany([
		{ href: 'ups/address-validation', label: 'Address Validation', parentId: ups._id },
		{ href: 'ups/get-rate', label: 'Get Rate', parentId: ups._id },
		{ href: 'ups/quote', label: 'Quote', parentId: ups._id },
		{ href: 'ups/quote-finder', label: 'Quote Finder', parentId: ups._id }
	]);
};

export const load = async () => {
	await connect();
	// await seed();

	return {
		rows: new Promise(async (res) => {
			const rows = await Route.find();
			res(JSON.parse(JSON.stringify(rows)));
		})
	};
};
