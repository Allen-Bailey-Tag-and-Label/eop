import { prisma } from '$lib/prisma';
import type { Role, Route } from '$lib/types';

const defaultRoles: Role[] = [{ label: 'default' }];
const defaultRoutes: Route[] = [
	{ href: '/dashboard', label: 'Dashboard' },
	{ href: '/onboarding', label: 'Onboarding' }
];

export const load = async () => {
	// get current roles
	const roles = await prisma.role.findMany();

	// check if there aren't any roles
	if (roles.length === 0) {
		// create default routes
		const routes = await Promise.all(
			defaultRoutes.map(async (data: Route) => await prisma.route.create({ data }))
		);

		// create default roles
		await Promise.all(
			defaultRoles.map(async (data: Role) => {
				// add routeIds to data
				data.routeIds = [...routes].map(({ id }) => id);
				await prisma.role.create({ data });
			})
		);
	}

	return {};
};
