import { connect } from '$lib/db';
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'

export async function post({body}) {
  // connect to db
  const client = await connect();

  // destructure body
  let {accessToken} = body;

  // decode token
  const decoded = jwt.verify(accessToken, import.meta.env.VITE_JWT_SECRET);

  // destructure token
  let { _id } = decoded;
  _id = ObjectId(_id);

  // find user
  const user = await client
    .db()
    .collection('users')
    .findOne({_id})

  // destructure user
  const { on : { signin } } = user;

  return {
    status: 200,
    body: {route: signin}
  }
}