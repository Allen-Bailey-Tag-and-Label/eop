import { Schema, type Types } from 'mongoose';
import { defineModel } from '../mongoose/defineModel';
import type { SlideDefinition, PlaylistDefinition } from '$lib/slides/types';

type ContentRecord<T> = {
	_id: Types.ObjectId;
	slug: string;
	title: string;
	version: number;
	draft: T;
	published?: T;
	publishedAt?: Date;
	publishedTitle?: string;
};
// Keep versioned content out of generic CRUD so all writes use validation and publishing.
const contentSchema = {
	slug: { type: String, required: true, unique: true },
	title: { type: String, required: true },
	version: { type: Number, required: true },
	draft: { type: Schema.Types.Mixed, required: true },
	published: Schema.Types.Mixed,
	publishedAt: Date,
	publishedTitle: String
};
export const Slide = defineModel<ContentRecord<SlideDefinition>>('MonitorSlide', contentSchema);
export const Playlist = defineModel<ContentRecord<PlaylistDefinition>>(
	'MonitorPlaylist',
	contentSchema
);
export type AssetRecord = {
	_id: Types.ObjectId;
	name: string;
	contentType: string;
	data: Buffer;
	scope?: 'slide' | 'shared' | 'unassigned';
	slideId?: Types.ObjectId;
};
// Avoid copying binary files into operation logs.
export const Asset = defineModel<AssetRecord>(
	'MonitorAsset',
	{
		name: { type: String, required: true },
		contentType: { type: String, required: true },
		data: { type: Buffer, required: true, select: false },
		scope: { type: String, enum: ['slide', 'shared', 'unassigned'], index: true },
		slideId: { type: Schema.Types.ObjectId, ref: 'MonitorSlide', index: true }
	},
	{ log: false }
);
