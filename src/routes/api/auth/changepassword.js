import { connect } from '$lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongodb from 'mongodb';
const { ObjectId } = mongodb;

export async function post({ body }) {
  // connect to db
  const client = await connect();

  // destructure body
  let { accessToken, currentPassword, password } = body;

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

  // compare password
  const compare = await bcrypt.compare(currentPassword, user.password);

  if ( !compare ) {
    return { 
      status: 403,
      body: {
        error: 'Creditials could not be verified.  Please try again'
      }
    }
  } else {

    // encrypt password
    password = await bcrypt.hash(password, 10);
    status = 'Active'

    // update password
    const doc = await client
      .db()
      .collection('users')
      .findOneAndUpdate({_id}, {$set: {password, status}});

    // destructure doc
    const {value: user} = doc;

    delete user.password;

    return {
      status: 200,
      body: { user}
    }
  }
}