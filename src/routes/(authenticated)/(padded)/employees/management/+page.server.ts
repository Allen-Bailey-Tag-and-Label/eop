import { pageServer } from '$lib/prismaTable';

const { actions, load } = await pageServer({
	columnOrder: [
		'firstName',
		'lastName',
		'dateOfHire',
		'emailSignatureTitle',
		'employeeNumber',
		'extension',
		'subordinateIds',
		'supervisorId'
	],
	modelName: 'UserProfile',
	relationLabelFns: new Map([
		['subordinates', ({ firstName, lastName }) => `${firstName} ${lastName}`],
		['supervisor', ({ firstName, lastName }) => `${firstName} ${lastName}`],
		['user', ({ username }) => username]
	]),
	sortKey: 'firstName'
});

export { actions, load };
