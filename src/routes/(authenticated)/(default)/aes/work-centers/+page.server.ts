import { getServerFunctions } from '$lib/dbTable';

const { actions, load } = await getServerFunctions('AESWorkCenter', {
	columns: new Map([
		['fixedOH', { label: 'Fixed OH' }],
		['number', { label: 'Work Center' }],
		['machSetupRate', { label: 'Machine Setup Rate' }],
		['machRunRate', { label: 'Machine Run Rate' }],
		['variableOH', { label: 'Variable OH' }]
	]),
	columnOrder: [
		'Work Center',
		'Description',
		'Setup Labor',
		'Run Labor',
		'Variable OH',
		'Fixed OH',
		'Machine Setup Rate',
		'Machine Run Rate'
	],
	getRelationLabelFunctions: new Map([]),
	orderBy: [{ number: 'asc' }]
});

export { actions, load };
