import { serverLoad } from '$lib/server/mongoose';
import { QuoteMarginCalculation } from '$lib/server/mongoose/models/QuoteMarginCalculation.js';

export const load = serverLoad({
	labelFunctionMap: new Map([['Branch', (doc) => `${doc.number}`]]),
	model: QuoteMarginCalculation,
	omitColumns: ['_id', 'current', 'previous']
});
