import { connect } from '$lib/db';
import mongodb from 'mongodb';
const { ObjectId } = mongodb;

export async function del({params, query}) {
  // connect to db
  const client = await connect();

  // get collection (slug)
  const { slug : collection } = params;

  // sanitize query
  query = Object.fromEntries(query);
  if ( '_id' in query ) query._id = ObjectId(query._id);

  console.log(query);

  // delete doc
  await client
    .db()
    .collection(collection)
    .findOneAndDelete(query)

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
  let rows = await client
    .db()
    .collection(collection)
    .find(query)
    .collation({locale: "en" })
    .sort(sort)
    .toArray()
  
  // users case
  if ( collection === 'users' ) rows = rows.map(row=>{delete row.password; return row})

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

  console.log(body)

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