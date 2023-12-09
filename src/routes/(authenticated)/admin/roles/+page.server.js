import { prisma } from '$lib/prisma';
import { formDataToObject } from '$utilities';
import { fail } from '@sveltejs/kit';

export const actions = {
  create: async ({ request }) => {
    // destructure request
    const { name } = formDataToObject(await request.formData());

    await prisma.role.create({ data: { name } });

    return { success: true };
  },
  delete: async ({ request }) => {
    // destructure request
    const { id } = formDataToObject(await request.formData());

    await prisma.role.delete({
      where: {
        id
      }
    });

    return { success: true };
  },
  edit: async ({ request }) => {
    // destructure request
    const { id, name, routeIds, userIds } = formDataToObject(await request.formData());

    await prisma.role.update({
      where: {
        id
      },
      data: {
        name,
        routeIds: JSON.parse(routeIds),
        userIds: JSON.parse(userIds)
      }
    });

    return { success: true };
  }
};
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
