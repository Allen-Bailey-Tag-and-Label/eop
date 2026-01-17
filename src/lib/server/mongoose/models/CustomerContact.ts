import { Types } from 'mongoose';
import { defineModel } from '../defineModel';

export const CustomerContact = defineModel('CustomerContact', {
	_customer: { type: Types.ObjectId, ref: 'Customer' },
	city: { type: String },
	email: { type: String },
	firstName: { type: String },
	lastName: { type: String },
	phone: { type: Number },
	state: { type: String },
	street: { type: String },
	title: { type: String },
	zip: { type: String }
});
