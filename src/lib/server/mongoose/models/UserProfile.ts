import { defineModel } from '../defineModel';
import { hooks } from '../hooks';

export const UserProfile = defineModel(
	'UserProfile',
	{
		email: { type: String, unique: true, sparse: true, default: '' },
		firstName: { type: String, default: '' },
		lastName: { type: String, default: '' },
		phone: { type: Number, default: 0 }
	},
	{
		customHooks: [hooks.userProfile._userId, hooks.userProfile.fullName]
	}
);
