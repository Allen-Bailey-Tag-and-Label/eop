import type { GetColumnsOptions } from './types';

export const filterFields = (field: { [key: string]: any }, options: GetColumnsOptions) =>
	!field.isId &&
	options?.fieldFilterNames !== undefined &&
	!options.fieldFilterNames.includes(field.name) &&
	field?.dbTable?.type !== undefined;
