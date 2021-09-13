import { connect } from '$lib/db';
import mongodb from 'mongodb';
const { ObjectId } = mongodb;
import authenticateUser from '../../auth/get/_userId'

export async function patch({ body, query }) {
  // connect to db
  const client = await connect();

  // check for auth
  if ('auth' in body) body = await authenticateUser(body);

  // sanitize query
  query = Object.fromEntries(query);
  if ('_id' in query) query._id = ObjectId(query._id);

  // insert into database
  const doc = await client
    .db()
    .collection('covid-daily-questionnaire')
    .findOneAndUpdate(query, { $set: body }, { returnOriginal: false });

  return {
    status: 200,
    body: doc.value,
  };
}

export async function post({ body }) {
  // connect to db
  const client = await connect();

  // format date
  body.date = +body.date;
  
  // check for auth
  if ('auth' in body) body = await authenticateUser(body);

  // insert into database
  const doc = await client.db().collection('covid-daily-questionnaire').insertOne(body);

  return {
    status: 200,
    body: doc.ops[0]
  };
}