import { serverLoad } from '$lib/server/mongoose';
import { QuoteMarginCalculation } from '$lib/server/mongoose/models/QuoteMarginCalculation.js';

export const load = serverLoad({
	model: QuoteMarginCalculation,
	omitColumns: ['_id', 'current', 'previous']
});
