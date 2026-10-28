import { defineModel } from '../defineModel';
import type { Types } from 'mongoose';

export const Holiday = defineModel<{ _id: Types.ObjectId; date: Date; name?: string }>('Holiday', {
	date: { type: Date, required: true, index: true },
	name: { type: String, default: '', maxlength: 160 }
});
