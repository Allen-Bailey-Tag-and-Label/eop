import { prisma } from '$lib/prisma';
import { createFormActions } from '$lib/dataTable';

export const actions = createFormActions('PayChangeRequestCode');
export const load = async () => {
  const [payChangeRequestCodes] = await Promise.all([
    prisma.payChangeRequestCode.findMany({
      orderBy: [{ description: 'asc' }]
    })
  ]);
  return {
    payChangeRequestCodes
  };
};
