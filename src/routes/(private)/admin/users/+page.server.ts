import { connect } from '$lib/server/mongoose';
import { Branch, Role, User, UserPasswordReset } from '$lib/server/mongoose/models';
import type { Actions } from '@sveltejs/kit';
import { hashSync } from 'bcryptjs';
import { Types } from 'mongoose';

export const actions: Actions = {
	'reset-password': async ({ locals, request }) => {
		const { username } = <{ username: string }>Object.fromEntries(await request.formData());
		const code = Math.floor(Math.random() * 999999)
			.toString()
			.padStart(6, '0');
		const codeHash = hashSync(code);

		await UserPasswordReset.findOneAndUpdate(
			{ username },
			{
				$set: {
					_createdById: locals.user._id,
					codeHash,
					username
				}
			},
			{
				_createdById: new Types.ObjectId(locals.user._id),
				context: 'query',
				new: true,
				setDefaultsOnInsert: true,
				upsert: true
			}
		);

		return { code };
	}
};

export const load = async () => {
	await connect();

	return {
		branches: new Promise(async (res) => {
			const branches = await Branch.find().lean();
			res(JSON.parse(JSON.stringify(branches)));
		}),
		roles: new Promise(async (res) => {
			const roles = await Role.find().lean();
			res(JSON.parse(JSON.stringify(roles)));
		}),
		rows: new Promise(async (res) => {
			const rows = await User.find().populate('_createdById', 'username').populate('_roleIds');
			res(JSON.parse(JSON.stringify(rows)));
		})
	};
};
