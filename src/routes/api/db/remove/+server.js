import { ObjectId } from 'mongodb';
import db from '$db';

export async function POST({ request }) {
  try {
    // destructure request
    let { collection, query } = await request.json();

    // sanitize query
    query.$or = query.$or.map(({ _id }) => {
      return { _id: ObjectId(_id) };
    });

    // perform update
    await db.remove({ collection, query });

    // return response
    return new Response({});
  } catch (error) {
    console.log(error);
    return new Response();
  }
}
