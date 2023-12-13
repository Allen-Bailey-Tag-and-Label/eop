import { prisma } from '$lib/prisma';
import { createFormActions } from '$lib/dataTable';

export const actions = createFormActions('PayChangeRequest');
export const load = async () => {
  const [payChangeRequests] = await Promise.all([
    prisma.payChangeRequest.findMany({
      include: {
        newCode: true,
        userProfile: {
          include: {
            jobTitle: true
          }
        }
      },
      orderBy: [{ newDate: 'desc' }]
    })
  ]);
  return {
    payChangeRequests
  };
};
