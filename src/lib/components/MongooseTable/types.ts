import * as models from '$lib/server/mongoose/models';
import type {
	ColumnSanitized as DatatableColumnSanitized,
	ColumnType as DatatableColumnType,
	Props as DatatableProps,
	Row,
	Settings as DatatableSettings
} from '../Datatable/types';

export * from '../Datatable/types';
export type Column = string | ({ key: string } & Partial<Omit<ColumnSanitized, 'key'>>);
export type ColumnOverride = Partial<ColumnSanitized>;
export type ColumnOverrides = Record<string, ColumnOverride>;
export type ColumnType = DatatableColumnType | 'ref';
export type ColumnSanitized = Omit<DatatableColumnSanitized, 'type'> & { type: ColumnType };
export type Data = {
	columns: Column[];
	isPaginatable: boolean;
	rows: Promise<unknown[]>;
	settings: Settings & { isPaginateable: true };
	totalRows: Promise<number>;
};
export type Models = keyof typeof models;
export type Props = Omit<DatatableProps, 'columns' | 'columnsSanitized' | 'rows' | 'settings'> & {
	columns?: Column[];
	columnOverrides?: ColumnOverrides;
	columnsSanitized?: ColumnSanitized[];
	data: Data;
	isLoading?: boolean;
	modelName: Models;
	rows?: Row[];
	settings?: Settings;
	totalRows?: number;
	virtualColumns?: Column[];
};
export type Settings = DatatableSettings & { _routeId: string };
