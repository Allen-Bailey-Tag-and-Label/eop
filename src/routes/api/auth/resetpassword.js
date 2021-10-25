import { connect } from '$lib/db';
import bcrypt from 'bcryptjs';
import mongodb from 'mongodb';
import randomWords from 'random-words';
const { ObjectId } = mongodb;

export async function post({ body }) {
  // connect to db
  const client = await connect();

  // destructure body
  let { _id } = body;
  _id = ObjectId(_id);

  // find user
  let user = await client
    .db()
    .collection('users')
    .findOne({_id})
    
  // encrypt password
  const initialPassword = randomWords({ exactly: 2, join: '' });
  const password = await bcrypt.hash(initialPassword, 10);

  // update password
  const doc = await client
    .db()
    .collection('users')
    .findOneAndUpdate({_id}, {$set: {initialPassword, password}});

  // destructure doc
  const {value} = doc;
  user = value;

  delete user.password;

  return {
    status: 200,
    body: { user }
  }
}