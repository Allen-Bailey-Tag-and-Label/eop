import { connect } from '$lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import randomWords from 'random-words';

export async function post({ body }) {
  // connect to db
  const client = await connect();

  // get random password
  let randomPassword = randomWords({ exactly: 2, join: '' });

  // defaults
  const defaults = {
    ennisId: '',
    email: '',
    extension: '',
    firstName: '',
    hireDate:0,
    initialPassword: randomPassword,
    lastName:'',
    on: {
      signin: '/dashboard',
    },
    password: randomPassword,
    roles: [],
    status: 'Active',
  };

  // merge body with defaults
  body = Object.assign(defaults, body);
  
  // destructure body
  let {
    ennisId,
    email,
    extension,
    firstName,
    hireDate,
    initialPassword,
    lastName,
    on,
    password,
    roles,
    status,
    username,
  } = body;

  // encrypt password
  password = await bcrypt.hash(password, 10);

  // format hireDate
  hireDate = +hireDate;

  // insert into database
  const insert = await client
    .db()
    .collection('users')
    .insertOne({
      ennisId,
      email,
      extension,
      firstName,
      hireDate,
      initialPassword,
      lastName,
      on,
      password,
      roles,
      status,
      username,
    });

  // get user
  const user = insert.ops[0];

  // destructure user
  const { _id } = user;

  // sign accessToken
  const accessToken = jwt.sign({ _id }, import.meta.env.VITE_JWT_SECRET);

  return {
    status: 200,
    body: { accessToken, password: initialPassword },
  };
}
