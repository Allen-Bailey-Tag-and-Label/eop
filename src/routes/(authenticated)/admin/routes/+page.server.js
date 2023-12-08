import { prisma } from '$lib/prisma';
import { formDataToObject } from '$utilities';

export const actions = {
  create: async ({ request }) => {
    // destructure request
    const { group, label, href } = formDataToObject(await request.formData());

    await prisma.route.create({ data: { group, label, href } });

    return { success: true };
  },
  delete: async ({ request }) => {
    // destructure request
    const { id } = formDataToObject(await request.formData());

    await prisma.route.delete({
      where: {
        id
      }
    });

    return { success: true };
  },
  edit: async ({ request }) => {
    // destructure request
    const { id, group, label, href } = formDataToObject(await request.formData());

    await prisma.route.update({
      where: {
        id
      },
      data: {
        group,
        label,
        href
      }
    });

    return { success: true };
  }
};
export const load = async () => {
  const routes = await prisma.route.findMany({ orderBy: [{ group: 'asc' }, { label: 'asc' }] });
  return {
    routes
  };
};
