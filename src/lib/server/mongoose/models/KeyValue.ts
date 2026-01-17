import { Schema } from 'mongoose';
import { defineModel } from '../defineModel';

export const KeyValue = defineModel('KeyValue', {
	key: { type: String, required: true, trim: true },
	value: { type: Schema.Types.Mixed, required: true }
});
