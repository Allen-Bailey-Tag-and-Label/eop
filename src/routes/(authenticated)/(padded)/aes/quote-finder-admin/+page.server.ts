import { pageServer } from '$lib/prismaTable';
import { _pageServerParams } from '../quote-finder/+page.server';

const { actions, load } = await pageServer(Object.assign(_pageServerParams, { isDeletable: true }));

export { _pageServerParams, actions, load };
