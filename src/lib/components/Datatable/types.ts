import { type Snippet } from 'svelte';
import { filterOperators } from './filterOperators';

export type Column = string | ({ key: string } & Partial<Omit<ColumnSanitized, 'key'>>);
export type ColumnSanitized = {
	compareFn: (a: any, b: any) => any;
	isCreatable: boolean;
	isEditable: boolean;
	isFilterable: boolean;
	key: string;
	label: string;
	options: Option[];
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
	| 'select'
	| 'string'
	| 'symbol'
	| 'timestamp'
	| 'undefined';
export type Filter = {
	key: string;
	operator: FilterOperator;
	options: Option[];
	value: any;
};
export type FilterOperator = (typeof filterOperators)[number];
export type Option = { label: any; value: any };
export type Pagination = boolean | Partial<PaginationSanitized>;
export type PaginationSanitized = {
	currentPage: number;
	rowsPerPage: number;
};
export type Props = {
	columns: Column[];
	columnsSanitized?: ColumnSanitized[];
	create?: Record<string, any>;
	createDialog?: Snippet;
	deleteDialog?: Snippet;
	filters?: Filter[];
	filterDialog?: Snippet;
	filterKeyOptions?: Option[];
	filtersTemp?: (Omit<Filter, 'operator'> & { operator: FilterOperator | '' })[];
	filtersTempSanitized?: {
		key: string;
		operator: FilterOperator | '';
		options: Option[];
		snippet: Snippet<[TdSnippet]>;
		value: any;
	}[];
	isCreatable?: boolean;
	isCreateDialogOpen?: boolean;
	isDeletable?: boolean;
	isDeleteDialogOpen?: boolean;
	isEditable?: boolean;
	isFilterable?: boolean;
	isFilterDialogOpen?: boolean;
	isSortable?: boolean;
	pagination?: Pagination;
	rows: Row[];
	rowsCheckboxValues?: boolean[];
	rowsSelected?: boolean[];
	sort?: Sort;
	tbody?: Snippet;
	thead?: Snippet;
	toolbar?: Snippet;
};
export type Row = Record<string, any>;
export type RowSanitized = {
	index: number;
	row: Row;
};
export type Sort = Partial<SortSanitized>;
export type SortSanitized = {
	direction: 'asc' | 'desc';
	index: number;
	key: string;
};
export type TdSnippet = { isEditable: boolean; key: string; object: any; options: Option[] };
