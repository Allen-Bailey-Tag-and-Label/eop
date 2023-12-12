import { prisma } from '$lib/prisma';
import { createFormActions } from '$lib/dataTable';

export const actions = createFormActions('Role');

export const load = async () => {
  const [roles, routes, userProfiles] = await Promise.all([
    prisma.role.findMany({
      include: {
        routes: true,
        userProfiles: {
          include: true
        }
      },
      orderBy: [{ name: 'asc' }]
    }),
    prisma.route.findMany({
      include: { roles: true },
      orderBy: [{ group: 'asc' }, { label: 'asc' }]
    }),
    prisma.userProfile.findMany({
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
    })
  ]);

  return {
    roles,
    routes,
    userProfiles
  };
};
