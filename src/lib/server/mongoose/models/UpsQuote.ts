import { Schema, Types } from 'mongoose';
import { defineModel } from '../defineModel';

export const UpsQuote = defineModel('UpsQuote', {
	_branchId: { type: Types.ObjectId, requried: true, ref: 'Branch' },
	classification: { type: String, required: true },
	isValidated: { type: Boolean, required: true },
	packageTotalCount: { type: Number, required: true },
	packageTotalWeight: { type: Number, required: true },
	packageWeight: { type: Number, required: true },
	quote: { type: Number, required: true },
	rates: { type: [Schema.Types.Mixed], required: true },
	shipper: { type: Schema.Types.Mixed, required: true },
	shipTo: { type: Schema.Types.Mixed, required: true }
});
