import { defineModel } from '../defineModel';

export const Customer = defineModel('Customer', {
	name: { type: String },
	number: { type: Number },
	phone: { type: Number },
	website: { type: String }
});
