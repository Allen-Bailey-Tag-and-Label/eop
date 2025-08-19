import { type Snippet } from 'svelte';

export type Column<CompareType = any> =
	| string
	| ({ key: string } & Partial<Omit<ColumnSanitized<CompareType>, 'key'>>);
export type ColumnSanitized<CompareType = any> = {
	class?: string;
	compareFn: Compare<CompareType>;
	isCreatable: boolean;
	isEditable: boolean;
	isExportable: boolean;
	isFilterable: boolean;
	isHidden: boolean;
	isProtected: boolean;
	isSortable: boolean;
	key: string;
	label: string;
	options: Option[];
	snippet: Snippet<[TdSnippet]>;
	type: string;
	valueFn?: ValueFn;
};
export type ColumnType =
	| 'bigint'
	| 'boolean'
	| 'currency'
	| 'function'
	| 'multiSelect'
	| 'number'
	| 'object'
	| 'select'
	| 'string'
	| 'symbol'
	| 'timestamp'
	| 'undefined';
export type Compare<CompareType = any> = (a: CompareType, b: CompareType, dir: -1 | 1) => number;
export type Filter = {
	key: string;
	operator: FilterOperator;
	options: Option[];
	value: any;
};
export type FilterOperator = string;
export type Option = { label: any; value: any };
export type PaginationSettings = {
	indexes: {
		start: number;
		end: number;
	};
	options: Option[];
	totalPages: number;
};
export type Props<CompareType = any> = {
	columns: Column<CompareType>[];
	columnInferredTypes?: string[];
	columnsSanitized?: ColumnSanitized<CompareType>[];
	create?: Record<string, any>;
	createModal?: Snippet;
	deleteModal?: Snippet;
	exportOption?: string;
	filters?: Filter[];
	filterModal?: Snippet;
	filterKeyOptions?: Option[];
	filtersTemp?: Filter[];
	filtersTempSanitized?: {
		key: string;
		operator: FilterOperator | '';
		options: Option[];
		snippet: Snippet<[TdSnippet]>;
		value: any;
	}[];
	isAllRowsSelected?: boolean;
	isColumnsReorderable?: boolean;
	isCreatable?: boolean;
	isCreateModalOpen?: boolean;
	isDeletable?: boolean;
	isDeleteModalOpen?: boolean;
	isEditable?: boolean;
	isExportable?: boolean;
	isExportModalOpen?: boolean;
	isFilterable?: boolean;
	isFilterModalOpen?: boolean;
	isPaginateable?: boolean;
	isSelectable?: boolean;
	isSettingsVisible?: boolean;
	isSettingsModalOpen?: boolean;
	isSortable?: boolean;
	isToolbarVisible?: boolean;
	pagination?: Snippet;
	paginationSettings?: PaginationSettings;
	rowKeyMap?: WeakMap<object, string>;
	rows: Row[];
	rowsFiltered?: RowSanitized[];
	rowsCheckboxValues?: boolean[];
	rowsPaginated?: RowSanitized[];
	rowsSanitized?: RowSanitized[];
	rowsSelected?: boolean[];
	settings?: Partial<Settings>;
	settingsTemp?: Pick<Settings, 'rowsPerPage'>;
	tbody?: Snippet;
	th?: Snippet<[ColumnSanitized<CompareType> & { columnIndex: number }]>;
	thead?: Snippet;
	toolbar?: Snippet;
	totalRows?: number;
};
export type Row = Record<string, any>;
export type RowSanitized = {
	_key: string;
	index: number;
	row: Row;
};
export type Settings = {
	columnsOrder: string[];
	currentPage: number;
	filter: Filter[];
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
	valueFn?: ValueFn;
};
export type ValueFn = ({ key, object }: { key: string; object: any }) => any;
