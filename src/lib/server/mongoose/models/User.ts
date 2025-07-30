import { Types } from 'mongoose';
import { defineModel } from '../defineModel';
import { hooks } from '../hooks';

export const User = defineModel(
	'User',
	{
		_branchIds: [{ type: Types.ObjectId, ref: 'Branch' }],
		_defaultBranchId: { type: Types.ObjectId, ref: 'Branch' },
		_profileId: { type: Types.ObjectId, ref: 'UserProfile' },
		_roleIds: [{ type: Types.ObjectId, ref: 'Role' }],
		_settingsId: { type: Types.ObjectId, ref: 'UserSettings' },
		isActive: { type: Boolean, default: false },
		passwordHash: { type: String, required: true },
		username: { type: String, required: true, unique: true }
	},
	{ customHooks: [hooks.user.save] }
);
