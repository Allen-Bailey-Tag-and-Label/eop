import { pageServer } from '$lib/prismaTable';
import type { PageServer } from '$lib/prismaTable/types';

const _pageServerParams: PageServer = {
	columnOrder: [
		'customerType',
		'productType',
		'previousQuoteNumber',
		'previousQuoteDate',
		'previousSellPrice',
		'quoteNumber',
		'quoteDate',
		'sellPrice'
	],
	columnOverrides: new Map([
		['previousSellPrice', { type: 'Currency' }],
		['sellPrice', { type: 'Currency' }],
		['laborAmount', { isVisible: false }],
		['marginAmount', { isVisible: false }],
		['materialAmount', { isVisible: false }],
		['previousLaborAmount', { isVisible: false }],
		['previousMarginAmount', { isVisible: false }],
		['previousMaterialAmount', { isVisible: false }],
		['previousTotalCostAmount', { isVisible: false }],
		['totalCostAmount', { isVisible: false }],
		['type', { isVisible: false }]
	]),
	isDeletable: false,
	isEditable: false,
	isSavable: false,
	modelName: 'QuoteMarginQuote',
	sortDirection: -1,
	sortKey: 'quoteNumber'
};

const { actions, load } = await pageServer(_pageServerParams);

export { _pageServerParams, actions, load };
