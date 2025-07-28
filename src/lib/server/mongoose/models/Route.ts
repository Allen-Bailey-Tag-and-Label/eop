import { Types } from 'mongoose';
import { defineModel } from '../defineModel';

export const Route = defineModel('Route', {
	_parentId: { type: Types.ObjectId, ref: 'Route' },
	href: String,
	isDirectory: { type: Boolean, default: false },
	label: { type: String, required: true }
});
