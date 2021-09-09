import { connect } from '$lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function post({ body }) {
  // connect to db
  const client = await connect();

  // defaults
  const defaults = {
    extension: '',
    on: {
      signin: '/dashboard',
    },
    roles: [],
    status: 'Unverified',
  };

  // merge body with defaults
  body = Object.assign(defaults, body);

  // destructure body
  let { username, extension, password, firstName, lastName, on, roles, status } = body;

  // encrypt password
  password = await bcrypt.hash(password, 10);

  // insert into database
  const insert = await client
    .db()
    .collection('users')
    .insertOne({ username, extension, password, firstName, lastName, on, roles, status });

  // get user
  const user = insert.ops[0]

  // destructure user
  const { _id } = user;

  // sign accessToken
  const accessToken = jwt.sign({_id}, import.meta.env.VITE_JWT_SECRET)

    return {
      status: 200,
      body: { accessToken }
    }
}
