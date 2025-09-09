import { serverLoad } from '$lib/server/mongoose';
import { QuoteWorkCenter } from '$lib/server/mongoose/models/QuoteWorkCenter.js';

export const load = serverLoad({
	labelFunctionMap: new Map([['Branch', (doc) => `${doc.number}`]]),
	model: QuoteWorkCenter
});
