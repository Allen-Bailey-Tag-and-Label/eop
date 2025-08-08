import type { Model, Document, Query } from 'mongoose';
import type { Column } from '$lib/components/MongooseTable/types';

export type { Column };
export type Filter = object;
export type LabelFunctionMap = Map<string, (doc: any) => any>;
export type Lean<T> = Omit<T, keyof Document> & { _id: any };
export type { Model };
export type { Query };
export type Settings = {
	_routeId: string;
	currentPage: number;
	filter: Filter;
	rowsPerPage: number;
	sortDirection: 'asc' | 'desc';
	sortKey: string;
};
export type Sort = Record<string, 1 | -1>;
