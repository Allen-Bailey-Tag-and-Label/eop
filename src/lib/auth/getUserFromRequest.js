import 'dotenv/config';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import db from '$db';

export default async (request, options = { deletePassword: true }) => {
  // get cookies from
  const cookies = parse(request.headers.get('cookie'));

  // destructure cookies
  const { token } = cookies;

  // decode token
  const { username } = await jwt.verify(token, process.env.JWT_SECRET);

  // update user info
  const [user] = await db.find({ collection: 'users', query: { username } });

  // delete password
  if (options.deletePassword) delete user.password;

  return user;
};
