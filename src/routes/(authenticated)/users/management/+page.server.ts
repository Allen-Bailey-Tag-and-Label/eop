import { DateTime } from 'luxon';
import { prisma } from '$lib/prisma';
import { createFormActions } from '$lib/dataTable';

export const actions = createFormActions('UserProfile');
export const load = async () => {
  // // update user profile hire dates
  // const users = await prisma.userProfile.findMany();
  // await Promise.all(
  //   users.map(async (user) => {
  //     await prisma.userProfile.update({
  //       where: {
  //         id: user.id
  //       },
  //       data: {
  //         dateOfHire: DateTime.fromISO(user.dateOfHire).toFormat('yyyy-MM-dd')
  //       }
  //     });
  //   })
  // );
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
