import { prisma } from '$lib/prisma';
import { createFormActions } from '$lib/dataTable';

export const actions = createFormActions('Route');

export const load = async () => {
  const [roles, routes] = await Promise.all([
    prisma.role.findMany({
      orderBy: [{ name: 'asc' }]
    }),
    prisma.route.findMany({
      include: { roles: true },
      orderBy: [{ group: 'asc' }, { label: 'asc' }]
    })
  ]);
  return {
    roles,
    routes
  };
};
