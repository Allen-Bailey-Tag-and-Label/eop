import type { Actions } from '@sveltejs/kit';
import { hashSync } from 'bcryptjs';
import { Types } from 'mongoose';
import { User, UserPasswordReset, UserProfile, UserSettings } from '$lib/server/mongoose/models';
import { serverLoad } from '$lib/server/mongoose/serverLoad';
import { sanitizeDataFromSchema } from '../../api/mongooseTable/sanitizeDataFromSchema.js';

export const actions: Actions = {
	'create-profile': async ({ locals, request }) => {
		const { email, firstName, lastName, ...formData } = <Record<string, string>>(
			Object.fromEntries(await request.formData())
		);
		const _createdById = locals.user._id;
		const ennisId = +formData.ennisId;
		const hireDate = new Date(formData.hireDate);
		const phone = +formData.phone;

		const profile = await UserProfile.create({
			_createdById,
			ennisId,
			hireDate,
			phone,
			email,
			firstName,
			lastName
		}).then((doc) => doc.toObject());

		return JSON.parse(JSON.stringify({ _profileId: profile._id }));
	},
	'create-settings': async ({ locals, request }) => {
		const formData = <Record<string, string>>Object.fromEntries(await request.formData());

		const _createdById = locals.user._id;
		const magnification = +formData.magnification;

		const settings = await UserSettings.create({ _createdById, magnification }).then((doc) =>
			doc.toObject()
		);

		return JSON.parse(JSON.stringify({ _settingsId: settings._id }));
	},
	'create-user': async ({ locals, request }) => {
		const formData = await request.formData();

		const _createdById = locals.user._id;

		const data: Record<string, any> = {};

		for (const [key, value] of formData.entries()) {
			if (key === 'modelName' || key === '_id') continue;

			if (data[key] !== undefined) {
				data[key] = Array.isArray(data[key]) ? [...data[key], value] : [data[key], value];
			} else {
				data[key] = value;
			}
		}

		const { isActive, ...sanitizedData } = sanitizeDataFromSchema(User, data);

		const passwordHash = hashSync(data.password);

		const create = {
			_createdById,
			isActive: isActive === 'on',
			passwordHash,
			...sanitizedData
		};

		await User.create(create);

		return {};
	},
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

export const load = serverLoad({
	labelFunctionMap: new Map([['UserProfile', (doc) => `${doc.firstName} ${doc.lastName}`]]),
	model: User,
	omitColumns: ['passwordHash']
});
