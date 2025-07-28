import { defineModel } from '../defineModel';

export const Log = defineModel(
	'Log',
	{
		data: {},
		model: { type: String, required: true },
		operation: { type: String, required: true }
	},
	{ log: false }
);
