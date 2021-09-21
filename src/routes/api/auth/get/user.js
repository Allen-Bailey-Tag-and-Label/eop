import { connect } from '$lib/db';
import jwt from 'jsonwebtoken';
import mongodb from 'mongodb';
const { ObjectId } = mongodb;

export async function get({ query }) {
  // connect to db
  const client = await connect();
  
  // sanitize query
  query = Object.fromEntries(query);

  // destructure query
  const { auth: accessToken } = query;

  // decode token
  const decoded = jwt.verify(accessToken, import.meta.env.VITE_JWT_SECRET);

  // destructure token
  let { _id } = decoded
  _id = ObjectId(_id);

  // find user
  const user = await client
    .db()
    .collection('users')
    .findOne({_id})

  // remove password
  delete user.password

  return {
    status: 200,
    body: user
  };
};