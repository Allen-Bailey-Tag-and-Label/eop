import { invalid } from '@sveltejs/kit';
import 'dotenv/config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getUserFromRequest } from '$lib/auth';
import db from '$db';

export const actions = {
  default: async ({ cookies, request }) => {
    try {
      const data = await request.formData();

      // destructure request
      let { currentPassword, password, passwordConfirm } = Object.fromEntries(data);

      // check if new passwords do not match
      if (password !== passwordConfirm) {
        return invalid(401, { error: { message: 'New passwords do not match.' } });
      }

      // get user
      let user = await getUserFromRequest(request, { deletePassword: false });

      // check if credentials do not match
      if (!user || !(await bcrypt.compare(currentPassword, user?.password))) {
        return invalid(401, { error: { message: 'Current password does not match.' } });
      }

      // hash password
      password = await bcrypt.hash(password, 10);

      // update password
      await db.update({
        collection: 'users',
        query: { _id: user._id },
        update: { $set: { password } }
      });

      // find user
      [user] = await db.find({ collection: 'users', query: { _id: user._id } });

      // delete user password
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

      // return response
      return { message: 'Successfully changed password.', success: true };
    } catch (error) {
      console.log(error);
      return invalid(401, { error: { message: 'Error' } });
    }
  }
};
