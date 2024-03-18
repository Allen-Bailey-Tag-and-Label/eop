import { getColumns, updateOptions } from '$lib/dbTable';
import { prisma } from '$lib/prisma';
import { convert } from '$utilities';

export const actions = {
	update: async ({ request }) => {
		const { id: featureID, value } = convert(await request.formData()).formData.to.Object();
		const isActive = value === 'true';
		try {
			await prisma.aESItemProductFeature.upsert({
				where: {
					featureID
				},
				create: {
					featureID,
					isActive
				},
				update: {
					isActive
				}
			});
		} catch (error) {
			console.log(error);
		}
		return { success: true };
	}
};

export const load = async () => {
	const options = updateOptions('AESFeature', {
		columns: new Map([
			['key', { isEditable: false, label: 'ID' }],
			['description', { isEditable: false }]
		]),
		columnOrder: ['ID', 'Description'],
		filteredColumns: ['itemProductFeature', 'type', 'seq', 'isPrintable']
	});
	let { columns, errors } = await getColumns(options);
	columns = [...columns, { key: 'isActive', label: 'Active', type: 'boolean' }];
	const model = 'AESItemProductFeature';
	const orderBy = [{ key: 'asc' }];
	const rows = await prisma.aESFeature.findMany({ include: { itemProductFeature: true } });

	return {
		dbTable: {
			columns,
			errors,
			model,
			orderBy,
			rows
		}
	};
};

// import { getServerFunctions } from '$lib/dbTable';

// const { actions, load } = await getServerFunctions('AESItemProductFeature', {
// 	columns: new Map([]),
// 	getRelationLabelFunctions: new Map([['feature', (row) => row.description]]),
// 	orderBy: []
// });

// export { actions, load };
