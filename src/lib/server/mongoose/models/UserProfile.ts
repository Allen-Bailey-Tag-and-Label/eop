import { Types } from 'mongoose';
import { defineModel } from '../defineModel';
import { hooks } from '../hooks';

export const UserProfile = defineModel(
	'UserProfile',
	{
		ennisId: { type: Number, default: 0 },
		email: { type: String, default: '' },
		firstName: { type: String, default: '' },
		hireDate: { type: Date },
		lastName: { type: String, default: '' },
		phone: { type: Number, default: 0 }
	},
	{
		customHooks: [hooks.userProfile._userId, hooks.userProfile.fullName]
	}
);
