import { Types } from 'mongoose';
import { defineModel } from '../defineModel';
import { hooks } from '../hooks';

export type UserProfileRecord = {
	_id: Types.ObjectId;
	ennisId: number;
	email: string;
	firstName: string;
	hireDate?: Date;
	birthDate?: Date | null;
	lastName: string;
	phone: number;
};

export const UserProfile = defineModel<UserProfileRecord>(
	'UserProfile',
	{
		ennisId: { type: Number, default: 0 },
		email: { type: String, default: '' },
		firstName: { type: String, default: '' },
		birthDate: { type: Date },
		hireDate: { type: Date },
		lastName: { type: String, default: '' },
		phone: { type: Number, default: 0 }
	},
	{
		customHooks: [hooks.userProfile._userId, hooks.userProfile.fullName]
	}
);
