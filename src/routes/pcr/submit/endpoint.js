import { connect } from '$lib/db';
import mongodb from 'mongodb';
const { ObjectId } = mongodb;

export async function patch({ body, query }) {
  // connect to db
  const client = await connect();

  // sanitize query
  query = Object.fromEntries(query);
  if ( 'date' in query ) query.date = +query.date;
  if ('_id' in query) query._id = ObjectId(query._id);
  if ('userId' in query) query.userId = ObjectId(query.userId);

  // reformat input
  body.userId = ObjectId(body.userId);
  body.previous.after = +body.previous.after.replace(/[\$\,]/g,'')
  body.previous.date = +body.previous.date;
  body.previous.previous = +body.previous.previous.replace(/[\$\,]/g,'')
  body.previous.percent = +body.previous.percent.replace(/\%/g,'');
  body.change.after = +body.change.after.replace(/[\$\,]/g,'')
  body.change.date = +body.change.date;
  body.change.previous = +body.change.previous.replace(/[\$\,]/g,'')
  body.change.percent = +body.change.percent.replace(/\%/g,'');

  console.log({query})

  // find and update doc
  const doc = await client
    .db()
    .collection('pay-change-requests')
    .findOneAndUpdate(query, { $set: body }, { returnOriginal: false });

  return { 
    status: 200,
    body: doc.value
  }
}

export async function post({ body }) {
  // connect to db
  const client = await connect();

  // reformat input
  body.userId = ObjectId(body.userId);
  if ( 'previous' in body) {
    body.previous.after = +body.previous.after.replace(/[\$\,]/g,'')
    body.previous.date = +body.previous.date;
    body.previous.previous = +body.previous.previous.replace(/[\$\,]/g,'')
    body.previous.percent = +body.previous.percent.replace(/\%/g,'');
  }
  body.change.after = +body.change.after.replace(/[\$\,]/g,'')
  body.change.date = +body.change.date;
  body.change.previous = +body.change.previous.replace(/[\$\,]/g,'')
  body.change.percent = +body.change.percent.replace(/\%/g,'');
  // body.status = 'Approved';

  // insert into database
  const doc = await client.db().collection('pay-change-requests').insertOne(body);

  return { 
    status: 200,
    body: doc.ops[0]
  }
}