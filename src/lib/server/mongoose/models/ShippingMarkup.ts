import { Schema } from 'mongoose';
import { defineModel } from '../defineModel';
import type { MarkupConfig } from '$lib/shipping/types';

// One configuration per service makes overlap validation and concurrent edits atomic.
export const ShippingMarkup = defineModel<MarkupConfig>('ShippingMarkup', {
	service: { type: String, enum: ['UPS', 'LTL'], required: true, unique: true },
	revision: { type: Number, required: true, default: 0 },
	ranges: {
		type: [
			new Schema(
				{
					id: { type: String, required: true },
					minCents: { type: Number, min: 0, required: true },
					maxCents: { type: Number, default: null },
					percentBps: { type: Number, min: 0, required: true }
				},
				{ _id: false, id: false }
			)
		],
		default: []
	}
});
