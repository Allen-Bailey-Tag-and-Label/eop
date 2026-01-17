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
