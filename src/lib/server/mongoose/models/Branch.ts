import { defineModel } from '../defineModel';
import { hooks } from '../hooks';

export const Branch = defineModel(
	'Branch',
	{
		label: { type: String, required: true },
		number: { type: Number, required: true, unique: true }
	},
	{ customHooks: [hooks.branch._branchIds, hooks.branch._defaultBranchId] }
);
