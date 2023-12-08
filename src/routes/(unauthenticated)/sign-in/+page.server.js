import bcrypt from 'bcryptjs';
import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { prisma } from '$lib/prisma';
import { formDataToObject } from '$utilities';

export const actions = {
  default: async ({ cookies, request }) => {
    try {
      // get password and username from request
      const { password, username } = formDataToObject(await request.formData());

      // initiate user variable
      let user;

      // check if username doesn't exist
      try {
        user = await prisma.user.findUniqueOrThrow({
          where: { username },
          include: { profile: true }
        });
      } catch (error) {
        throw 'Username does not exist';
      }

      // check if username is not active
      try {
        if (!user.isActive) throw 'Username is not active';
      } catch (error) {
        throw error;
      }

      // check if password matches user hash
      try {
        if (!bcrypt.compareSync(password, user.passwordHash)) throw 'Incorrect password';
      } catch (error) {
        throw error;
      }

      // update session id cookie
      cookies.set('session_id', user.id, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: !dev,
        maxAge: 60 * 60 * 24 * 7
      });
    } catch (error) {
      return fail(401, { error });
    }
    throw redirect(303, '/dashboard');
  }
};
