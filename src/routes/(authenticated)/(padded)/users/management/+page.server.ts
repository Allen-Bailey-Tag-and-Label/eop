import { default as bcrypt } from 'bcryptjs';
import { generateSlug } from 'random-word-slugs';
import { getFields, getFieldsRequiringRelation, pageServer } from '$lib/prismaTable';
import type { ActionParams, Field } from '$lib/prismaTable/types';
import { prisma } from '$lib/prisma';

const generatePassword = () =>
	[
		...generateSlug(2, {
			format: 'lower',
			categories: { adjective: ['color'], noun: ['food'] }
		}).split(' '),
		Math.floor(Math.random() * 9999)
			.toString()
			.padStart(4, '0')
	].join('');

const { actions, load } = await pageServer({
	actions: new Map([
		[
			'reset-password',
			async ({ request }: ActionParams) => {
				const { id } = <Record<string, string>>Object.fromEntries(await request.formData());
				const password = generatePassword();
				const passwordHash = bcrypt.hashSync(password);
				await prisma.user.update({
					where: {
						id
					},
					data: {
						passwordHash
					}
				});
				return { password, success: true };
			}
		]
	]),
	columnOrder: ['isActive', 'username', 'passwordHash', 'roleIds'],
	columnOverrides: new Map([
		[
			'passwordHash',
			{
				isCreatable: false,
				isExportable: false,
				isFilterable: false,
				label: 'password',
				type: 'Password'
			}
		]
	]),
	filters: [{ key: 'isActive', operand: 'is', value: true }],
	modelName: 'User',
	sortKey: 'username'
});

export { actions, load };
