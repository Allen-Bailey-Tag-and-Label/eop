import { format } from '$lib';
import { pageServer } from '$lib/prismaTable';
import type { PageServer } from '$lib/prismaTable/types';

export const _pageServerParams: PageServer = {
	columnOrder: ['ennisNumber', 'label', 'territoryId', 'city', 'state', 'zip', 'contactId'],
	columnOverrides: new Map([['contacts', { isEditable: false }]]),
	modelName: 'Customer',
	relationLabelFns: new Map([
		[
			'contact',
			({ name, phone }) =>
				[name, format.phone(phone)]
					.map((value) => (value.replace(/\s/g, '') === '' ? 'N/A' : value))
					.join(' - ')
		]
	]),
	sortKey: 'ennisNumber'
};

const { actions, load } = await pageServer(_pageServerParams);

export { actions, load };
