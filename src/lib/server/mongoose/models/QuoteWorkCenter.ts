import { Types } from 'mongoose';
import { defineModel } from '../defineModel';

export const QuoteWorkCenter = defineModel('QuoteWorkCenter', {
	_branchId: { type: Types.ObjectId, ref: 'Branch', required: true },
	label: { type: String, required: true },
	machineSetupRate: { type: Number, required: true },
	machineRunRate: { type: Number, required: true },
	number: { type: Number, required: true, unique: true }
});
