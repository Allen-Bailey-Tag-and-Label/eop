import { default as bcrypt } from 'bcryptjs';
import { fail, type Actions } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const { currentPassword, password, retypePassword } = <Record<string, string>>(
			Object.fromEntries(await request.formData())
		);

		// check if new passwords do not match
		if (password !== retypePassword)
			return fail(403, {
				error: {
					inputClasses: {
						password: 'ring-offset-red-500 dark:ring-offset-red-500',
						retypePassword: 'ring-offset-red-500 dark:ring-offset-red-500'
					},
					message: 'Passwords do not match'
				}
			});

		// check if password does not match
		if (!bcrypt.compareSync(currentPassword, locals?.user?.passwordHash))
			return fail(403, {
				error: {
					inputClasses: { currentPassword: 'ring-offset-red-500 dark:ring-offset-red-500' },
					message: 'Current password does not match'
				}
			});

		// hash new password
		const passwordHash = bcrypt.hashSync(password);

		// update db
		await prisma.user.update({
			where: {
				id: locals?.user?.id || ''
			},
			data: {
				passwordHash
			}
		});

		return { success: true };
	}
};
