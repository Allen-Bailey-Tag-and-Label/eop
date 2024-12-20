import type { RequestEvent } from '@sveltejs/kit';
import type { Snippet } from 'svelte';

export type ActionParams = RequestEvent<Partial<Record<string, string>>, string | null>;
export type Column = {
	isList: boolean;
	isRelational: boolean;
	key: string;
	label: string;
	relationKey?: string;
	relationOptions: RelationOption[];
	type: string;
	width: number;
};
export type Field = {
	isId: boolean;
	isRequired: boolean;
	name: string;
	type: string;
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
export type RelationOption = { label: string | number; value: string };
export type RelationLabelFns = Map<string, (relationModel: Record<string, any>) => any>;
export type Row = Record<string, any>;
export type SanitizedColumn = Column & { snippet: Snippet<[any]> };
export type SnippetProps = {
	key: string;
	relationOptions: { label: any; value: string }[];
	row: Row;
	rowIndex: number;
};
