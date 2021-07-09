import { connect } from '$lib/db';
import bcrypt from 'bcrypt';

export async function post({ body }) {
  // connect to db
  const client = await connect();

  // defaults
  const defaults = {
    active: true,
    on: {
      signin: '/dashboard',
    },
    roles: [],
  };

  // merge body with defaults
  body = Object.assign(defaults, body);

  // destructure body
  let { email, password, firstName, lastName, on, roles } = body;

  // encrypt password
  password = await bcrypt.hash(password, 10);

  // insert into database
  await client
    .db()
    .collection('users')
    .insertOne({ email, password, firstName, lastName, on, roles });

    return {
      status: 200,
      body: {}
    }
}
