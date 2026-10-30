import type { SlideDataSource, DataValue } from '$lib/slides/types';

export type DataRecord = Record<string, DataValue>;
export type SourceReference = { sourceId: string; output: string; parameters: DataRecord };
export type Expression =
	| DataValue
	| { field: string }
	| { param: string }
	| { op: string; args: Expression[] };
export type WorkflowNode = {
	position?: { x: number; y: number };
	id: string;
	type: 'database' | 'api' | 'literal' | 'join' | 'filter' | 'map' | 'sort' | 'group';
	inputs: string[];
	config: Record<string, unknown>;
};
export type WorkflowDefinition = {
	schemaVersion: 1;
	parameters: DataRecord;
	nodes: WorkflowNode[];
	outputs: Record<string, { nodeId: string; fields: string[]; idField: string }>;
	refreshSeconds: number;
	staleSeconds: number;
};
export type SourceOption = {
	id: string;
	title: string;
	outputs: Record<string, string[]>;
	parameters: DataRecord;
};
export type ApiConnection = {
	baseUrl: string;
	paths: string[];
	auth: 'none' | 'bearer' | 'header';
	headerName: string;
	secretEnv: string;
	timeoutMs: number;
};
export type WorkflowResult = {
	outputs: Record<string, DataRecord[]>;
	nodes: Record<string, DataRecord[]>;
	updatedAt: string;
	stale?: boolean;
};
export type DatabaseNode = { query: SlideDataSource };
export const blankWorkflow = (): WorkflowDefinition => ({
	schemaVersion: 1,
	parameters: {},
	nodes: [
		{
			id: 'rows',
			type: 'literal',
			inputs: [],
			config: { rows: [{ id: 'example', name: 'Example' }] }
		}
	],
	outputs: { rows: { nodeId: 'rows', fields: ['id', 'name'], idField: 'id' } },
	refreshSeconds: 0,
	staleSeconds: 0
});
export class DataWorkflowError extends Error {}
