import type { Options } from './types';

export const filterFields = (field: { [key: string]: any }, options: Options) => {
	return (
		!field.isId &&
		field?.dbTable?.type !== undefined &&
		!options?.filteredColumns?.includes(field.name)
	);
};
