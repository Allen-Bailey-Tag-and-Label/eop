import { Types } from 'mongoose';
import { defineModel } from '../defineModel';

export const Role = defineModel('Role', {
	label: { type: String, required: true, unique: true },
	routes: [{ type: Types.ObjectId, ref: 'Route' }]
});
