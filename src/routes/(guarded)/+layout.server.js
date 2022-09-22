import { invalid } from '@sveltejs/kit';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { getUserFromRequest } from '$lib/auth';
import db from '$db';

export async function load({ cookies, request }) {
  try {
    // get collections
    let collections = await db.find({ collection: 'collections' });
    collections = await Promise.all(
      collections.map(async ({ name: collection }) => {
        const docs = await db.find({ collection });
        return { collection, docs };
      })
    );
    collections = collections.reduce((obj, { collection, docs }) => {
      obj[collection] = docs;
      return obj;
    }, {});

    // get user
    const user = await getUserFromRequest(request);

    // update token
    const token = await jwt.sign(user, process.env.JWT_SECRET);

    // update cookie
    cookies.set('token', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // one week
    });

    return {
      collections: JSON.parse(JSON.stringify(collections)),
      user: JSON.parse(JSON.stringify(user))
    };
  } catch (error) {
    console.error(error);
    cookies.set('token', '', {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1
    });
    return invalid(401, { error: { message: 'Session expired' } });
  }
}
