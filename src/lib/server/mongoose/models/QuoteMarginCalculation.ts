import { Schema, Types } from 'mongoose';
import { defineModel } from '../defineModel';

const QuoteSchema = new Schema(
	{
		date: { type: Date, required: true },
		labor: { type: Number, required: true },
		margin: { type: Number, required: true },
		material: { type: Number, required: true },
		number: { type: Number, required: true },
		sell: { type: Number, required: true },
		totalCost: { type: Number, required: true }
	},
	{ _id: false }
);

export const QuoteMarginCalculation = defineModel('QuoteMarginCalculation', {
	_branchId: { type: Types.ObjectId, ref: 'Branch' },
	current: { type: QuoteSchema, required: true },
	customerType: { enum: ['direct', 'distributor'], type: String, required: true },
	previous: { type: QuoteSchema, required: true },
	productType: { enum: ['LB', 'TG', 'TG2', 'TG3', 'TGM'], type: String, required: true }
});
