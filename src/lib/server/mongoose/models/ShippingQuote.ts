import { Schema } from 'mongoose';
import { defineModel } from '../defineModel';
import type {
	ShippingRequest,
	PricedRate,
	ProviderAttempt,
	ShippingGeneration,
	MarkupConfig
} from '$lib/shipping/types';

export type ShippingQuoteRecord = {
	generation?: ShippingGeneration & { attemptId?: string; leaseUntil?: Date };
	pricing?: MarkupConfig[];
	number: string;
	requestKey: string;
	_branchId: Schema.Types.ObjectId;
	_createdById: Schema.Types.ObjectId;
	createdAt: Date;
	request: ShippingRequest;
	rates: PricedRate[];
	attempts: ProviderAttempt[];
};
export const ShippingQuote = defineModel<ShippingQuoteRecord>('ShippingQuote', {
	generation: Schema.Types.Mixed,
	pricing: [Schema.Types.Mixed],
	number: { type: String, required: true, unique: true },
	requestKey: { type: String, required: true, unique: true },
	_branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
	request: { type: Schema.Types.Mixed, required: true },
	rates: { type: [Schema.Types.Mixed], required: true },
	attempts: { type: [Schema.Types.Mixed], required: true }
});

// Retain the original collection/document so numbers reserved before the shared sequence are not reused.
export const ShippingQuoteSequence = defineModel<{ _id: string; value: number }>(
	'ShippingQuoteSequence',
	{
		_id: String,
		value: { type: Number, default: 0 }
	},
	{ log: false }
);
