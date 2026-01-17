import { Branch, PhysicalInventoryItem } from '$lib/server/mongoose/models';
import type { Actions } from '@sveltejs/kit';

const itemKeys = [
	'branchId',
	'stockingType',
	'lineType',
	'itemNumber',
	'description',
	'description2',
	'searchText',
	'salesCode1',
	'salesCode2',
	'salesCode3',
	'salesCode4',
	'salesCode5',
	'purchCode1',
	'purchCode2',
	'purchCode3',
	'planFmly',
	'costRule',
	'buyerNumber',
	'plannerNumber',
	'supplierNumber',
	'itemFlashMessage',
	'thirdItemNumber',
	'shortItemNo',
	'itemClass',
	'groupWarehouseProcess1',
	'groupWarehouseProcess2',
	'groupWarehouseProcess3',
	'categoryCode8',
	'categoryCode10'
];
export const actions: Actions = {
	default: async ({ request }) => {
		const { csv } = <Record<string, string>>Object.fromEntries(await request.formData());
		const branches = await Branch.find();

		const rows = csv
			.trim()
			.split('\n')
			.map((row) => row.split('\t'));

		const items = rows
			.slice(1)
			.map((row) => {
				const object = row.reduce((object: Record<string, any>, value, index) => {
					object[itemKeys[index]] = value.trim();
					if (index === 0) {
						const branch = branches.find((b) => b.number === +value.trim());
						if (branch) object[itemKeys[index]] = branch._id;
						if (!branch) object[itemKeys[index]] = null;
					}

					return object;
				}, {});
				return object;
			})
			.filter((row) => row.branchId !== null);

		await PhysicalInventoryItem.insertMany(items);

		return { success: true };
	}
};
