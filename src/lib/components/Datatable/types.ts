import { type Snippet } from 'svelte';
import { filterOperators } from './filterOperators';

export type Column = string | ({ key: string } & Partial<Omit<ColumnSanitized, 'key'>>);
export type ColumnSanitized = {
	compareFn: (a: any, b: any) => any;
	isEditable: boolean;
	isFilterable: boolean;
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
export type Filter = {
	key: string;
	operator: FilterOperator;
	value: any;
};
export type FilterOperator = (typeof filterOperators)[number];
export type Pagination = boolean | Partial<PaginationSanitized>;
export type PaginationSanitized = {
	currentPage: number;
	rowsPerPage: number;
};
export type Props = {
	columns: Column[];
	filters?: Filter[];
	isDeletable?: boolean;
	isEditable?: boolean;
	isFilterable?: boolean;
	isSortable?: boolean;
	pagination?: Pagination;
	rows: Row[];
	sort?: Sort;
	tbody?: Snippet;
	thead?: Snippet;
	toolbar?: Snippet;
};
export type Row = Record<string, any>;
export type RowSanitized = {
	index: number;
	isSelected: boolean;
	row: Row;
};
export type Sort = Partial<SortSanitized>;
export type SortSanitized = {
	direction: 'asc' | 'desc';
	index: number;
	key: string;
};
export type TdSnippet = { isEditable: boolean; key: string; object: any };
