import { prisma } from '$lib/prisma';

export const load = async () => {
	const [workOrderRoutings, userProfiles] = await Promise.all([
		prisma.workOrderRouting.findMany(),
		prisma.userProfile.findMany()
	]);

	return { workOrderRoutings, userProfiles };
};
