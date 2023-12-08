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
      // find all users in legacy db
      const users = await client.db().collection('users').find().toArray();

      // delete all users in current db
      await prisma.user.deleteMany();

      // add users to current db
      await Promise.all(
        users.map(async (user) => {
          // destructure user data
          const {
            ennisId: ennisIdString,
            email,
            firstName,
            hireDate,
            isActive,
            lastName,
            password: passwordHash,
            username
          } = user;

          // parse ennisIdString
          const ennisId = +ennisIdString;

          // parse hireDate
          const dateOfHire = DateTime.fromMillis(hireDate);
          const { id: profileId } = await prisma.userProfile.create({
            data: {
              dateOfHire,
              ennisId,
              email,
              firstName,
              lastName
            }
          });
          await prisma.user.create({
            data: {
              isActive,
              lastLogin: DateTime.now(),
              passwordHash,
              profileId,
              username
            }
          });
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
