import { prisma } from '$lib/prisma';
import { createFormActions } from '$lib/dataTable';

export const actions = createFormActions('Role');

export const load = async () => {
  const [roles, routes, users] = await Promise.all([
    prisma.role.findMany({
      include: { routes: true, users: { include: { profile: true } } },
      orderBy: [{ name: 'asc' }]
    }),
    prisma.route.findMany({
      include: { roles: true },
      orderBy: [{ group: 'asc' }, { label: 'asc' }]
    }),
    prisma.user.findMany({
      include: {
        profile: true
      },
      orderBy: [
        {
          profile: {
            firstName: 'asc'
          }
        },
        {
          profile: {
            lastName: 'asc'
          }
        }
      ]
    })
  ]);

  return {
    roles,
    routes,
    users
  };
};
