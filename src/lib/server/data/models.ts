import { Schema, type Types } from 'mongoose';
import { defineModel } from '../mongoose/defineModel';
import type { ApiConnection, WorkflowDefinition, WorkflowResult } from '$lib/data/types';

type SourceRecord = {
	_id: Types.ObjectId;
	title: string;
	scope?: 'slide' | 'shared';
	slideId?: string;
	version: number;
	draft: WorkflowDefinition;
	published?: WorkflowDefinition;
	publishedTitle?: string;
	publishedAt?: Date;
};
export const DataSource = defineModel<SourceRecord>('DataSource', {
	title: { type: String, required: true },
	scope: { type: String, enum: ['slide', 'shared'], default: 'slide', index: true },
	slideId: { type: String, index: true },
	version: { type: Number, required: true },
	draft: { type: Schema.Types.Mixed, required: true },
	published: Schema.Types.Mixed,
	publishedTitle: String,
	publishedAt: Date
});
type ConnectionRecord = {
	_id: Types.ObjectId;
	title: string;
	version: number;
	config: ApiConnection;
};
export const DataConnection = defineModel<ConnectionRecord>('DataConnection', {
	title: { type: String, required: true },
	version: { type: Number, required: true },
	config: { type: Schema.Types.Mixed, required: true }
});
type CacheRecord = {
	key: string;
	sourceId: string;
	result: Omit<WorkflowResult, 'nodes'>;
	freshUntil: Date;
	usableUntil: Date;
	expiresAt: Date;
};
export const DataSourceCache = defineModel<CacheRecord>(
	'DataSourceCache',
	{
		key: { type: String, unique: true, required: true },
		sourceId: { type: String, required: true, index: true },
		result: Schema.Types.Mixed,
		freshUntil: Date,
		usableUntil: Date,
		expiresAt: { type: Date, expires: 0 }
	},
	{ log: false }
);
