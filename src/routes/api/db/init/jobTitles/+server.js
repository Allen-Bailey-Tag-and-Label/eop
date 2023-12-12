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
      const jobTitles = await client.db().collection('job-titles').find().toArray();

      // delete all users in current db
      await prisma.jobTitle.deleteMany();

      // add users to current db
      await Promise.all(
        jobTitles.map(async (jobTitle) => {
          // destructure user data
          const {
            costCenter: costCenterString,
            eeoClassification: eeoClassificationString,
            jobCode: codeString,
            jobTitle: title,
            workCompClass: workCompClassString
          } = jobTitle;

          // parse strings
          const costCenter = +costCenterString;
          const code = +codeString;
          const eeoClassification = +eeoClassificationString;
          const workCompClass = +workCompClassString;
          try {
            await prisma.jobTitle.create({
              data: {
                costCenter,
                code,
                eeoClassification,
                title,
                workCompClass
              }
            });
          } catch (error) {
            console.log({ title, error });
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
