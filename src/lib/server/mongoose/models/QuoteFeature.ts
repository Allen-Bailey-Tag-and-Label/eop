import { defineModel } from '../defineModel';

export const QuoteFeature = defineModel('QuoteFeature', {
	code: { type: String, required: true, unique: true },
	label: { type: String, required: true }
});
