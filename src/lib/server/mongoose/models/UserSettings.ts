import { defineModel } from '../defineModel';
import { hooks } from '../hooks';

export const UserSettings = defineModel(
	'UserSettings',
	{
		magnification: { type: Number, default: 16 }
	},
	{
		customHooks: [hooks.userSettings._userId]
	}
);
