import { defineModel } from '../defineModel';
import { hooks } from '../hooks';

export const UserSettings = defineModel(
	'UserSettings',
	{
		magnification: { type: Number, default: 16 },
		theme: { type: String, default: 'elegant-midnight' }
	},
	{
		customHooks: [hooks.userSettings._userId]
	}
);
