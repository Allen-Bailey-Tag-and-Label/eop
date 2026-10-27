import { Schema } from 'mongoose';
import { defineModel } from '../defineModel';

const FieldSchema = new Schema(
	{
		key: {
			type: String,
			required: true,
			trim: true
		},
		label: {
			type: String,
			required: true,
			trim: true
		},
		type: {
			type: String,
			required: true,
			enum: ['string', 'number', 'boolean', 'date', 'select', 'textarea']
		},
		required: {
			type: Boolean,
			default: false
		},
		options: {
			type: [String],
			default: []
		}
	},
	{ _id: false }
);

export const DataTableDefinition = defineModel('DataTableDefinition', {
	name: {
		type: String,
		required: true,
		trim: true
	},
	slug: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true
	},
	fields: {
		type: [FieldSchema],
		default: []
	}
});
