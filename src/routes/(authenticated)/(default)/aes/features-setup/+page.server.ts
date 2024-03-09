import { getServerFunctions } from '$lib/dbTable';

const { actions, load } = await getServerFunctions('AESFeature', {
	columns: new Map([
		['key', { label: 'ID' }],
		['isPrintable', { label: 'Printable' }]
	]),
	columnOrder: ['ID', 'Description', 'Type', 'Seq', 'Printable']
});

export { actions, load };
