import { UpsQuote } from '$lib/server/mongoose/models';
import { serverLoad } from '$lib/server/mongoose/serverLoad';

export const load = serverLoad({
	labelFunctionMap: new Map([['Branch', (doc) => `${doc.number}`]]),
	model: UpsQuote,
	omitColumns: ['_id', 'rates', 'shipper', 'shipTo']
});
