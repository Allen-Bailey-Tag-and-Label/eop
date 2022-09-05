import 'dotenv/config';
import bcrypt from 'bcrypt';
import { serialize } from 'cookie';
import jwt from 'jsonwebtoken';
import { getUserFromRequest } from '$lib/auth';
import connect from '$db';

export async function POST({ request, setHeaders }) {
  try {
    // connect to db
    const client = await connect();

    // destructure request
    let { currentPassword, password } = await request.json();

    // get user
    let user = await getUserFromRequest(request, { deletePassword: false });

    // check if credentials do not match
    if (!user || !(await bcrypt.compare(currentPassword, user?.password))) {
      return new Response(JSON.stringify({ error: 'Current password does not match.' }), {
        status: 401
      });
    }

    // hash password
    password = await bcrypt.hash(password, 10);

    // initiate options
    const options = {
      returnDocument: 'after',
      upsert: true
    };

    // update password
    const { value: doc } = await client
      .db()
      .collection('users')
      .findOneAndUpdate({ _id: user._id }, { $set: { password } }, options);

    // update user
    user = doc;

    // delete user password
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

    // return response
    return new Response(JSON.stringify({ message: 'Successfully changed password.' }));
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error }), { status: 401 });
  }
}
