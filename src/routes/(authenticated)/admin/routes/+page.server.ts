import { prisma } from '$lib/prisma';
import { createFormActions } from '$lib/dataTable';

const schema = {
  roles: 'many-to-many'
};

export const actions = createFormActions('route', schema);

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
