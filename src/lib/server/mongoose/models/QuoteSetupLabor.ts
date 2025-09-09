import { Types } from 'mongoose';
import { defineModel } from '../defineModel';

export const QuoteSetupLabor = defineModel('QuoteSetupLabor', {
	_branchId: { type: Types.ObjectId, ref: 'Branch', required: true },
	_featureId: { type: Types.ObjectId, ref: 'QuoteFeature', required: true },
	_operationId: { type: Types.ObjectId, ref: 'QuoteOperation', required: true },
	_productTypeId: { type: Types.ObjectId, ref: 'QuoteProductType', required: true },
	_workCenterId: { type: Types.ObjectId, ref: 'QuoteWorkCenter', required: true },
	hours: { type: Number, required: true },
	quanityMax: { type: Number, default: 999999999 },
	quantityMin: { type: Number, default: 0 },
	slidingPercent: { type: Number, default: 1 }
});
