import { prisma } from '$lib/prisma';
import { createFormActions } from '$lib/dataTable';

export const actions = createFormActions('JobTitle');
export const load = async () => {
  const [jobTitles] = await Promise.all([
    prisma.jobTitle.findMany({
      orderBy: [{ title: 'asc' }]
    })
  ]);
  return {
    jobTitles
  };
};
