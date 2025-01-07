import type { RequestEvent } from '@sveltejs/kit';
import type { Snippet } from 'svelte';
import type { filterOperands } from './filterOperands';

export type ActionParams = RequestEvent<Partial<Record<string, string>>, string | null>;
export type Column = {
	isCreatable: boolean;
	isEditable: boolean;
	isExportable: boolean;
	isFilterable: boolean;
	isList: boolean;
	isRelational: boolean;
	isVisible: boolean;
	key: string;
	label: string;
	relationKey?: string;
	relationOptions: RelationOption[];
	type: string;
	width: number;
};
export type Field = {
	hasDefaultValue: boolean;
	isGenerated: boolean;
	isId: boolean;
	isList: boolean;
	isReadOnly: boolean;
	isRequired: boolean;
	isUnique: boolean;
	isUpdatedAt: boolean;
	kind: string;
	name: string;
	relationName?: string;
	relationFromFields?: string[];
	relationToFields?: string[];
	type: string;
};
export type Filter = {
	key: string;
	operand: (typeof filterOperands)[number];
	value: boolean | Date | number | string | string[];
};
export type Paginate = {
	currentPage: number;
	index: {
		start: number;
		end: number;
	};
	modal: Record<string, any>;
	numberOfRowsPerPage: number;
	options: { label: string; value: number }[];
	totalPages: number;
};
export type PageServer = {
	actions?: Map<
		string,
		({ request }: ActionParams) => Promise<{
			success: boolean;
		}>
	>;
	columnOmits?: string[];
	columnOrder?: string[];
	columnOverrides?: Map<string, Partial<Column>>;
	filters?: Filter[];
	isCreatable?: boolean;
	isDeletable?: boolean;
	isEditable?: boolean;
	isExportable?: boolean;
	isFilterable?: boolean;
	isSavable?: boolean;
	modelName: string;
	paginate?: boolean | Pick<Paginate, 'currentPage' | 'numberOfRowsPerPage'>;
	relationLabelFns?: RelationLabelFns;
	sortDirection?: -1 | 1;
	sortKey?: string;
};
export type RelationOption = { label: string | number; value: string };
export type RelationLabelFns = Map<string, (relationModel: Record<string, any>) => any>;
export type Row = Record<string, any>;
export type SanitizedColumn = Column & { snippet: Snippet<[any]> };
export type SnippetProps = {
	changeHandler?: (e: any) => any;
	isEditable: boolean;
	isVisible: boolean;
	key: string;
	name?: string;
	object: Record<string, any>;
	relationOptions: { label: any; value: string }[];
};
