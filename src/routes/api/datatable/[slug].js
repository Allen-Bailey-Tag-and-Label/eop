import { connect } from '$lib/db';
import { ObjectId } from 'mongodb'

export async function del({body, params}) {
  // connect to db
  const client = await connect();

  // get collection (slug)
  const { slug : collection } = params;

  // wait for all routes to be deleted
  await Promise.all(body.map(async _id=>{

    // find and delete route
    await client
      .db()
      .collection(collection)
      .findOneAndDelete({_id: ObjectId(_id)})
  }))

  return {
    status: 200,
    body: {}
  }
}

export async function get({ params, query }) {
  // connect to db
  const client = await connect();

  // get collection (slug)
  const { slug : collection } = params;

  // initialize sort
  let sort = {}

  // sanitize query
  query = Object.fromEntries(query);
  if ( '_id' in query ) query._id = ObjectId(query._id);
  if ( 'sort' in query ) {
    sort = JSON.parse(query.sort);
    delete query.sort;
  }

  // find rows
  const rows = await client
    .db()
    .collection(collection)
    .find(query)
    .collation({locale: "en" })
    .sort(sort)
    .toArray()

  return {
    status: 200,
    body: {
      rows
    }
  }
}

export async function patch({body, params, query}) {
  // connect to db
  const client = await connect();

  // get collection (slug)
  const { slug : collection } = params;

  // sanitize query
  query = Object.fromEntries(query);
  if ( '_id' in query ) query._id = ObjectId(query._id);

  // find and update doc
  const doc = await client
    .db()
    .collection(collection)
    .findOneAndUpdate(query, {$set: body}, {returnOriginal:false})

  return {
    status: 200,
    body: {
      doc: doc.value
    }
  }
}

export async function post({body, params}) {
  // connect to db
  const client = await connect();

  // get collection (slug)
  const { slug : collection } = params;

  // insert into database
  const doc = await client
    .db()
    .collection(collection)
    .insertOne(body)

  return {
    status: 200,
    body: {
      doc
    }
  }
}