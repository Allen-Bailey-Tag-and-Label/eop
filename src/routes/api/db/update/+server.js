import { ObjectId } from 'mongodb';
import db from '$db';

export async function POST({ request }) {
  try {
    // destructure request
    let { collection, query, update } = await request.json();

    // sanitize query
    query = Object.keys(query).reduce((obj, key) => {
      const value = key.substring(0, 1) === '_' ? ObjectId(query[key]) : query[key];
      obj[key] = value;
      return obj;
    }, {});

    // perform update
    await db.update({ collection, query, update });

    // find document
    const [doc] = await db.find({ collection, query });

    // return redirect location
    return new Response(JSON.stringify({ doc }));
  } catch (error) {
    console.log(error);
    return new Response();
  }
}
