import { type Snippet } from 'svelte';
import { filterOperators } from './filterOperators';

export type Column = string | ({ key: string } & Partial<Omit<ColumnSanitized, 'key'>>);
export type ColumnSanitized = {
	class?: string;
	compareFn: (a: any, b: any, direction: -1 | 1) => any;
	isCreatable: boolean;
	isEditable: boolean;
	isFilterable: boolean;
	key: string;
	label: string;
	options: Option[];
	snippet: Snippet<[TdSnippet]>;
	type: ColumnType;
} & any;
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
export type PaginationSettings = {
	indexes: {
		start: number;
		end: number;
	};
	options: Option[];
	totalPages: number;
};
export type Props = {
	columns: Column[];
	columnInferredTypes?: ColumnType[];
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
	isPaginateable?: boolean;
	isSelectable?: boolean;
	isSortable?: boolean;
	isToolbarVisible?: boolean;
	pagination?: Snippet;
	paginationSettings?: PaginationSettings;
	rows: Row[];
	rowsFiltered?: RowSanitized[];
	rowsCheckboxValues?: boolean[];
	rowsPaginated?: RowSanitized[];
	rowsSanitized?: RowSanitized[];
	rowsSelected?: boolean[];
	settings?: Partial<Settings>;
	tbody?: Snippet;
	th?: Snippet<[ColumnSanitized]>;
	thead?: Snippet;
	toolbar?: Snippet;
	totalRows?: number;
};
export type Row = Record<string, any>;
export type RowSanitized = {
	index: number;
	row: Row;
};
export type Settings = {
	currentPage: number;
	filter: object;
	rowsPerPage: number;
	sortDirection: 'asc' | 'desc';
	sortKey: string;
};
export type TdSnippet = {
	class?: string;
	isEditable: boolean;
	key: string;
	object: any;
	options: Option[];
} & any;
