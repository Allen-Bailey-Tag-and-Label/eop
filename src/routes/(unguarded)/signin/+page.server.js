import crypto from 'crypto';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { invalid, redirect } from '@sveltejs/kit';
import db from '$lib/db';

export const actions = {
  default: async ({ cookies, request }) => {
    // get form data
    const data = await request.formData();

    // destructure data
    let { password, username } = Object.fromEntries(data);

    // sanitize username
    username = username.toLowerCase().replace(/\s/g, '');

    // find username in database
    const [user] = await db.find({ collection: 'users', query: { username } });

    // check if user doesn't exist
    if (!user) return invalid(401, { error: { message: 'Could not verify credentials.' } });

    // check if password does not exist on server
    if (user?.password === undefined) {
      const hash = crypto
        .createHash('sha256', process.env.JWT_SECRET)
        .update(password)
        .digest('hex');
      await db.update({
        collection: 'users',
        query: { _id: user._id },
        update: { $set: { password: hash } }
      });
      user.password = hash;
    }

    // convert password to sha256 hash
    const hash = crypto.createHash('sha256', process.env.JWT_SECRET).update(password).digest('hex');

    // check if credentials do not match
    if (user.password !== hash) {
      cookies.set('token', '', {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1
      });
      return invalid(401, { error: { message: 'Could not verify credentials.' } });
    }

    // remove password from user for token
    delete user.password;

    // create token
    const token = jwt.sign(user, process.env.JWT_SECRET);

    // set token cookie
    cookies.set('token', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // one week
    });

    // return redirect location
    throw redirect(303, '/dashboard');
  }
};
