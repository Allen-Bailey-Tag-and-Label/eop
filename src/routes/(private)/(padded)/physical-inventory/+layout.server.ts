import { Branch, KeyValue } from '$lib/server/mongoose/models';

export const load = async () => {
	const [branch, branches] = await Promise.all([Branch.findOne({ number: 2046 }), Branch.find()]);

	let physicalInventoryBranchId = await KeyValue.findOne({ key: 'physicalInventoryBranchId' });

	if (physicalInventoryBranchId === null) {
		const update = {
			key: 'physicalInventoryBranchId',
			value: branch._id
		};
		physicalInventoryBranchId = await KeyValue.findOneAndUpdate(update, update, {
			new: true,
			upsert: true
		});
	}

	return {
		branches: JSON.parse(JSON.stringify(branches)),
		physicalInventoryBranchId: JSON.parse(JSON.stringify(physicalInventoryBranchId))
	};
};
