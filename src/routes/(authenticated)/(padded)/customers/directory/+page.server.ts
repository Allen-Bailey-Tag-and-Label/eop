import { pageServer } from '$lib/prismaTable';
import { _pageServerParams } from '../management/+page.server';

const { actions, load } = await pageServer(
	Object.assign(_pageServerParams, {
		isCreatable: false,
		isDeletable: false,
		isEditable: false,
		isSavable: false
	})
);

export { actions, load };
