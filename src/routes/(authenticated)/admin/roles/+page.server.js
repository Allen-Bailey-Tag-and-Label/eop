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
    const { id, name } = formDataToObject(await request.formData());

    await prisma.role.update({
      where: {
        id
      },
      data: {
        name
      }
    });

    return { success: true };
  },
  updateCheckbox: async ({ request }) => {
    // destructure request
    const { checked, roleId, routeId } = formDataToObject(await request.formData());

    // get current role
    const role = await prisma.role.findUnique({ where: { id: roleId } });

    // check if role doesn't exist
    if (role === undefined || role === null) return fail(400, { error: 'Could not find role' });

    // update route ids
    role.routeIds =
      checked === 'true'
        ? [...role.routeIds, routeId]
        : role.routeIds.filter((id) => id !== routeId);

    // update role
    await prisma.role.update({
      where: {
        id: roleId
      },
      data: {
        routeIds: role.routeIds
      }
    });

    return { success: true };
  }
};
export const load = async () => {
  const [roles, routes] = await Promise.all([
    prisma.role.findMany({ include: { routes: true }, orderBy: [{ name: 'asc' }] }),
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
