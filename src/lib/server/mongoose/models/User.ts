import { Types } from 'mongoose';
import { defineModel } from '../defineModel';
import { hooks } from '../hooks';

export const User = defineModel(
	'User',
	{
		_profileId: { type: Types.ObjectId, ref: 'UserProfile' },
		_settingsId: { type: Types.ObjectId, ref: 'UserSettings' },
		isActive: { type: Boolean, default: false },
		passwordHash: { type: String, required: true },
		roles: [{ type: Types.ObjectId, ref: 'Role' }],
		username: { type: String, required: true, unique: true }
	},
	{ customHooks: [hooks.user.save] }
);
