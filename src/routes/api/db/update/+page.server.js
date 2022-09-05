import { ObjectId } from 'mongodb';
import connect from '$db';
import { redirect } from '@sveltejs/kit';

export async function POST({ request }) {
  try {
    // connect to db
    const client = await connect();

    // destructure request
    let { collection, query, update } = await request.json();

    // sanitize query
    query = Object.keys(query).reduce((obj, key) => {
      const value = key.substring(0, 1) === '_' ? ObjectId(query[key]) : query[key];
      obj[key] = value;
      return obj;
    }, {});

    // perform update
    await client.db().collection(collection).findOneAndUpdate(query, update);

    // return redirect location
    return redirect(300, '/dashboard');
  } catch (error) {
    console.log(error);
    return { status: 401 };
  }
}
