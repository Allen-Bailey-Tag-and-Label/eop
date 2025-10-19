import { defineModel } from '../defineModel';

export const SignUp = defineModel('SignUp', {
	campaign: { type: String },
	firstName: { type: String },
	lastName: { type: String }
});
