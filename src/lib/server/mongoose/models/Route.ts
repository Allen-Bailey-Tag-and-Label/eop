import { Types } from 'mongoose';
import { defineModel } from '../defineModel';

export const Route = defineModel('Route', {
	href: { type: String, required: true },
	label: { type: String }
});
