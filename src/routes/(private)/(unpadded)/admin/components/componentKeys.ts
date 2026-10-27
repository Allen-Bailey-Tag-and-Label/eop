import * as components from '$lib/components';
import { omitComponentKeys } from './omitComponentKeys';

export const componentKeys = Object.keys(components).filter(
	(componentKey) => /^[A-Z]/.test(componentKey) && !omitComponentKeys.includes(componentKey)
);
