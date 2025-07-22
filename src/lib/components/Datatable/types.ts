import { type Snippet } from 'svelte';

export type Column = string | ({ key: string } & Partial<Omit<ColumnSanitized, 'key'>>);
export type ColumnSanitized = {
	compareFn: (a: any, b: any) => any;
	isEditable: boolean;
	key: string;
	label: string;
	snippet: Snippet<[TdSnippet]>;
	type: ColumnType;
};
export type ColumnType =
	| 'bigint'
	| 'boolean'
	| 'currency'
	| 'function'
	| 'number'
	| 'object'
	| 'string'
	| 'symbol'
	| 'timestamp'
	| 'undefined';
export type Pagination = boolean | Partial<PaginationSanitized>;
export type PaginationSanitized = {
	currentPage: number;
	rowsPerPage: number;
};
export type Props = {
	columns: Column[];
	isDeletable?: boolean;
	isEditable?: boolean;
	isSortable?: boolean;
	pagination?: Pagination;
	rows: Row[];
	sort?: Sort;
	tbody?: Snippet;
	thead?: Snippet;
	toolbar?: Snippet;
};
export type Row = Record<string, any>;
export type Sort = Partial<SortSanitized>;
export type SortSanitized = {
	direction: 'asc' | 'desc';
	index: number;
	key: string;
};
export type TdSnippet = { isEditable: boolean; key: string; row: Row; rowIndex: number };
