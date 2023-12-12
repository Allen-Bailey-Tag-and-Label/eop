import { prisma } from '$lib/prisma';
import { createFormActions } from '$lib/dataTable';

export const actions = createFormActions('UserProfile');
export const load = async () => {
  const [jobTitles, userProfiles] = await Promise.all([
    prisma.jobTitle.findMany({
      orderBy: [
        {
          title: 'asc'
        }
      ]
    }),
    prisma.userProfile.findMany({
      include: {
        jobTitle: true
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
    })
  ]);
  return {
    jobTitles,
    userProfiles
  };
};
