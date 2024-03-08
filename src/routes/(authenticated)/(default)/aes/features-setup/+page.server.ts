import { getServerFunctions } from '$lib/dbTable';

const { actions, load } = await getServerFunctions('AESFeature', {
	columns: new Map([['key', { label: 'id' }]]),
	columnOrder: ['key', 'description', 'type', 'seq', 'isPrintable']
});

export { actions, load };
