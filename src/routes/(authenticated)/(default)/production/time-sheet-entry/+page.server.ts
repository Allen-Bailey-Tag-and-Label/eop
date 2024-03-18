import { prisma } from '$lib/prisma';
import { convert } from '$utilities';

export const actions = {
	default: async ({ request }) => {
		try {
			const data = convert(await request.formData()).formData.to.Object();
			console.log(data);
			return { success: true };
		} catch (error) {
			console.log(error);
		}
	}
};

export const load = async () => {
	const [workOrderRoutings, userProfiles] = await Promise.all([
		prisma.workOrderRouting.findMany(),
		prisma.userProfile.findMany()
	]);

	return { workOrderRoutings, userProfiles };
};
