import 'dotenv/config';
import bcrypt from 'bcrypt';
import { serialize } from 'cookie';
import jwt from 'jsonwebtoken';
import { redirect } from '@sveltejs/kit';
import connect from '$lib/db';

export async function POST({ request, setHeaders }) {
  // connect to db
  const client = await connect();

  // destructure request
  let { password, username } = await request.json();
  username = username.toLowerCase().replace(/\s/g, '');

  // find username in database
  const user = await client.db().collection('users').findOne({ username });

  // check if credentials do not match
  if (!user || !(await bcrypt.compare(password, user?.password))) {
    setHeaders({
      'Set-Cookie': serialize('token', '', {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1
      })
    });
    return {
      status: 401,
      errors: {
        message: 'Credentials could not be verified'
      }
    };
  }

  // remove password from user for token
  delete user.password;

  // create token
  const token = jwt.sign(user, process.env.JWT_SECRET);

  // set token cookie
  setHeaders({
    'Set-Cookie': serialize('token', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // one week
    })
  });

  // return redirect location
  return redirect(300, '/dashboard');
}
