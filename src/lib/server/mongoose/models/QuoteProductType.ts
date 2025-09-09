import { defineModel } from '../defineModel';

export const QuoteProductType = defineModel('QuoteProductType', {
	code: { type: String, required: true, unique: true },
	label: { type: String, required: true }
});
