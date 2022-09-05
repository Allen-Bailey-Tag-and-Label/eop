import connect from '$db';

export async function POST({ request }) {
  try {
    // connect to db
    const client = await connect();

    // destructure request
    const { collection, insert } = await request.json();

    // initiate options
    const options = {
      returnDocument: 'after',
      upsert: true
    };

    // perform update
    const { value: doc } = await client
      .db()
      .collection(collection)
      .findOneAndUpdate(insert, { $set: {} }, options);

    // return redirect location
    return new Response(JSON.stringify({ doc }));
  } catch (error) {
    console.log(error);
    return new Response();
  }
}
