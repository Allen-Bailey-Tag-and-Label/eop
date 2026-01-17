import { Branch, KeyValue } from '$lib/server/mongoose/models';
import type { Actions } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request }) => {
		const { physicalInventoryBranchId } = <Record<string, string>>(
			Object.fromEntries(await request.formData())
		);

		await KeyValue.updateOne(
			{ key: 'physicalInventoryBranchId' },
			{ value: physicalInventoryBranchId }
		);

		return { success: true };
	}
};
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
