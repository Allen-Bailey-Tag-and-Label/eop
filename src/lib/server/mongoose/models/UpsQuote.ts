import { Schema, Types } from 'mongoose';
import { defineModel } from '../defineModel';

export const UpsQuote = defineModel('UpsQuote', {
	_branchId: { type: Types.ObjectId, requried: true, ref: 'Branch' },
	classification: { type: String, required: true },
	isValidated: { type: Boolean, required: true },
	packageTotalCount: { type: Number, required: true },
	packageTotalWeight: { type: Number, required: true },
	packageWeight: { type: Number, required: true },
	weightMode: { type: String, enum: ['total', 'each', 'groups'] },
	packageGroups: {
		type: [
			new Schema(
				{
					quantity: { type: Number, required: true, min: 1 },
					weight: { type: Number, required: true, min: 0.001, max: 150 }
				},
				{ _id: false }
			)
		],
		default: undefined
	},
	quote: { type: Number, required: true },
	rates: { type: [Schema.Types.Mixed], required: true },
	shipper: { type: Schema.Types.Mixed, required: true },
	shipTo: { type: Schema.Types.Mixed, required: true },
	requestKey: { type: String, unique: true, sparse: true },
	// Absent on historical quotes, which are already complete.
	generation: {
		type: new Schema(
			{
				validation: {
					type: String,
					enum: ['pending', 'running', 'complete', 'skipped', 'failed'],
					required: true
				},
				rates: { type: String, enum: ['pending', 'running', 'complete', 'failed'], required: true },
				message: String,
				attemptId: String,
				leaseUntil: Date
			},
			{ _id: false }
		),
		default: undefined
	}
});
