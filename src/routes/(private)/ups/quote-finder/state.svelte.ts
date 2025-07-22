import { PersistentState } from '@friendofsvelte/state';

export const persistentState = new PersistentState('ups/quote-finder', {
	columns: [
		{ label: 'Quote #', key: 'quote' },
		'date',
		'address',
		'city',
		'state',
		'zip',
		'classification'
	],
	sort: { direction: 'desc', key: 'quote' },
	rows: []
});
