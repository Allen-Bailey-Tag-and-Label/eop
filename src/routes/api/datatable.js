import { connect } from '$lib/db';
import mongodb from 'mongodb';
const { ObjectId } = mongodb;

export async function del({body}) {
  // connect to db
  const client = await connect();

  // wait for all routes to be deleted
  await Promise.all(body.map(async _id=>{

    // find and delete route
    await client
      .db()
      .collection('routes')
      .findOneAndDelete({_id: ObjectId(_id)})
  }))

  return {
    status: 200,
    body: {}
  }
}

export async function get() {
  // connect to db
  const client = await connect();

  // find routes
  const routes = await client
    .db()
    .collection('routes')
    .find()
    .collation({locale: "en" })
    .sort({ name: 1})
    .toArray()

  return {
    status: 200,
    body: {
      routes
    }
  }
}