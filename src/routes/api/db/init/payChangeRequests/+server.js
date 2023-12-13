import { DateTime } from 'luxon';
import { MongoClient } from 'mongodb';
import { ADMIN_PASSWORD, DATABASE_URL } from '$env/static/private';
import { prisma } from '$lib/prisma';

export const GET = async ({ url: { searchParams } }) => {
  // get auth password
  const adminPassword = searchParams.get('adminPassword');

  // check if password doesn't match
  if (adminPassword !== ADMIN_PASSWORD)
    return new Response('Invalid adminPassword passed', { status: 401 });

  try {
    // initiate mongodb client
    const client = new MongoClient(DATABASE_URL.replace('v2', 'production'));

    // connect to mongodb client
    await client.connect();
    try {
      // find all pay change requests in legacy db
      const payChangeRequests = await client
        .db()
        .collection('pay-change-requests')
        .find()
        .toArray();

      // find all users
      const users = await client.db().collection('users').find().toArray();

      // find all user profiles
      const userProfiles = await prisma.userProfile.findMany();

      // find all pay change request codes
      const payChangeRequestCodes = await prisma.payChangeRequestCode.findMany();

      // delete all users in current db
      await prisma.payChangeRequest.deleteMany();

      // add users to current db
      await Promise.all(
        payChangeRequests.map(async (payChangeRequest) => {
          // destructure user data
          const { change, previous, status, userId } = payChangeRequest;

          // create db fields
          const lastAfter =
            typeof previous?.after === 'string' ? parseFloat(previous.after) : previous?.after;
          const lastCodeId = payChangeRequestCodes.find(
            (payChangeRequestCode) => payChangeRequestCode.code === previous?.code
          )?.id;
          const lastDate = DateTime.fromMillis(
            previous?.date === undefined
              ? 0
              : typeof previous.date === 'string'
                ? +previous.date
                : previous.date
          );
          const lastDescription = previous?.description;
          const lastExempt = previous?.exempt;
          const lastExplanation = previous?.explanation;
          const lastPrevious =
            typeof previous?.previous === 'string'
              ? parseFloat(previous.previous)
              : previous?.previous;
          const lastPercent = lastAfter / lastPrevious - 1;
          const newAfter =
            typeof change?.after === 'string' ? parseFloat(change.after) : change?.after;
          const newCodeId = payChangeRequestCodes.find(
            (payChangeRequestCode) => payChangeRequestCode.code === change?.code
          )?.id;
          const newDate = DateTime.fromMillis(
            change?.date === undefined
              ? 0
              : typeof change.date === 'string'
                ? +change.date
                : change.date
          );
          const newDescription = change?.description;
          const newExempt = change?.exempt;
          const newExplanation = change?.explanation;
          const newPrevious =
            typeof change?.previous === 'string' ? parseFloat(change.previous) : change?.previous;
          const newPercent = newAfter / newPrevious - 1;

          const user = users.find((obj) => obj._id.toString() === userId.toString());

          const userProfile = userProfiles.find(
            (obj) => obj.firstName === user?.firstName && obj.lastName === user?.lastName
          );

          if (userProfile === undefined) return;

          try {
            await prisma.payChangeRequest.create({
              data: {
                lastAfter,
                lastCodeId,
                lastDate,
                lastDescription,
                lastExempt,
                lastExplanation,
                lastPrevious,
                lastPercent,
                newAfter,
                newCodeId,
                newDate,
                newDescription,
                newExempt,
                newExplanation,
                newPrevious,
                newPercent,
                status,
                userProfileId: userProfile.id
              }
            });
          } catch (error) {
            console.log({ payChangeRequest, error });
          }
        })
      );
    } catch (error) {
      console.log(error);
    }
    client.close();
    return new Response();
  } catch (error) {
    console.log(error);
    return new Response(null, { status: 402 });
  }
};
