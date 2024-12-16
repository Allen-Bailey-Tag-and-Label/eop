import type { Snippet } from 'svelte';

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
export type RelationOption = { label: string | number; value: string };
export type Row = Record<string, any>;
export type SanitizedColumn = Column & { snippet: Snippet<[any]> };
