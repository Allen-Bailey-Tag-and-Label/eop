import 'dotenv/config';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import connect from '$db';

export default async (request) => {
  // connect to db
  const client = await connect();

  // get cookies from
  const cookies = parse(request.headers.get('cookie'));

  // destructure cookies
  const { token } = cookies;

  // decode token
  const { username } = await jwt.verify(token, process.env.JWT_SECRET);

  // update user info
  const user = await client.db().collection('users').findOne({ username });

  // delete password
  delete user.password;

  return user;
};
