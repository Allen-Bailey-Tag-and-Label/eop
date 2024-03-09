import type { Prisma } from '@prisma/client';
export type Column = {
	getRelationLabel?: GetRelationLabelFunction;
	key?: string;
	label?: string;
	type?: string;
};
export type Error = {
	error: string;
	key: string;
};
export type GetRelationLabelFunction = (row: any) => string;
export type Include = { [key: string]: boolean };
export type ModelName = Prisma.ModelName;
export type Options = {
	columns?: Map<string, Column>;
	columnOrder?: string[];
	fields?: {}[];
	fieldMap?: Map<any, any>;
	filteredColumns?: string[];
	getRelationLabelFunctions?: Map<string, GetRelationLabelFunction>;
	orderBy?: OrderBy[];
};
export type OrderBy = { [key: string]: 'asc' | 'desc' };
