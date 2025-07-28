import { defineModel } from '../defineModel';

export const UserPasswordReset = defineModel('UserPasswordReset', {
	codeHash: { type: String, required: true },
	username: { type: String, required: true }
});
