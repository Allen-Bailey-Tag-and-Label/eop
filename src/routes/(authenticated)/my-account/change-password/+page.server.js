import bcrypt from 'bcryptjs';
import { fail, redirect } from '@sveltejs/kit';
import { formDataToObject } from '$utilities';
import { prisma } from '$lib/prisma';

export const actions = {
  default: async ({ locals, request }) => {
    // check if user doesn't exist in locals
    if (locals?.user === undefined) throw redirect(303, '/sign-out');

    // destructure form data
    const { currentPassword, password, passwordConfirmation } = await formDataToObject(
      await request.formData()
    );

    // check if passwords do not match
    if (password !== passwordConfirmation)
      return fail(401, { error: 'New passwords do not match' });

    // find user in db
    const user = await prisma.user.findUnique({ where: { id: locals.user.id } });

    // check if user doesn't exist
    if (user === null || user === undefined) throw redirect(303, '/sign-out');

    // check if current password doesn't match
    if (!bcrypt.compareSync(currentPassword, user.passwordHash))
      return fail(401, { error: 'Current password does not match' });

    // get new password hash
    const passwordHash = await new Promise((res) => {
      bcrypt.hash(password, 10, (err, hash) => {
        return res(hash);
      });
    });

    // update user in db
    await prisma.user.update({
      where: {
        id: locals.user.id
      },
      data: {
        passwordHash
      }
    });

    return { success: true };
  }
};
