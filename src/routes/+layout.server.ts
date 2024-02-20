import { DateTime } from 'luxon';
import seedUsers from '$lib/mongodb/seed.users.json';
import { prisma } from '$lib/prisma';
import type { Role, Route } from '$lib/types';

const defaultRoles: Role[] = [{ label: 'default' }];
const defaultRoutes: Route[] = [
	{ href: '/dashboard', label: 'Dashboard' },
	{ href: '/onboarding', label: 'Onboarding' }
];

export const load = async () => {
	// get current roles
	let roles = await prisma.role.findMany();

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
				const role = await prisma.role.create({ data });
				roles.push(role);
			})
		);
	}

	// get current users
	const users = await prisma.user.findMany();

	// check if there aren't any users
	if (users.length === 0) {
		await Promise.all(
			seedUsers.map(async (seed) => {
				const user = await prisma.user.create({
					data: {
						isActive: seed?.isActive || false,
						isOnboarded: true,
						passwordHash: seed.password,
						roleIds: roles.map((role) => role.id),
						username: seed.username
					}
				});

				await prisma.userProfile.create({
					data: {
						dateHired: DateTime.fromMillis(+seed?.hireDate || 0).toJSDate(),
						email: seed?.email,
						emailSignatureTitle: seed?.title || '',
						ennisId: +seed.ennisId,
						extension: +seed.extension,
						firstName: seed.firstName,
						lastName: seed.lastName,
						userId: user.id
					}
				});
			})
		);
	}

	return {};
};
