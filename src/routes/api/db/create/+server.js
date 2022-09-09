import db from '$db';

export async function POST({ request }) {
  try {
    // destructure request
    const { collection, insert } = await request.json();

    // perform insert
    await db.create({ collection, insert });

    // find doc
    const [doc] = await db.find({ collection, query: insert });

    // return redirect location
    return new Response(JSON.stringify({ doc }));
  } catch (error) {
    console.log(error);
    return new Response();
  }
}
