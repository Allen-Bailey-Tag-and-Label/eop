import { ObjectId } from 'mongodb';
import connect from '$db';

export async function POST({ request }) {
  try {
    // connect to db
    const client = await connect();

    // destructure request
    let { collection, query } = await request.json();

    // sanitize query
    query.$or = query.$or.map(({ _id }) => {
      return { _id: ObjectId(_id) };
    });

    // perform update
    await client.db().collection(collection).deleteMany(query);

    // return response
    return new Response({});
  } catch (error) {
    console.log(error);
    return new Response();
  }
}
