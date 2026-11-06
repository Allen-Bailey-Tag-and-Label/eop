import { Schema, type Types } from 'mongoose';
import { defineModel } from '../mongoose/defineModel';
import type { MonitorNavigationCommand } from '$lib/monitors/types';

export type MonitorRecord = {
	_id: Types.ObjectId;
	tokenHash: string;
	pairingCode?: string;
	status: 'pending' | 'approved' | 'revoked';
	location: string;
	expiresAt?: Date;
	approvedAt?: Date;
	approvedById?: Types.ObjectId;
	lastSeenAt?: Date;
	playlistId?: Types.ObjectId;
	colorMode?: 'light' | 'dark' | 'system';
	refreshVersion?: number;
	navigationCommands?: MonitorNavigationCommand[];
};

// Deliberately outside the general model barrel: credentials must not be exposed
// through the generic MongooseTable CRUD endpoints or operation logs.
export const MonitorSession = defineModel<MonitorRecord>(
	'MonitorSession',
	{
		tokenHash: { type: String, required: true, unique: true, select: false },
		pairingCode: { type: String, unique: true, sparse: true, select: false },
		status: { type: String, enum: ['pending', 'approved', 'revoked'], required: true },
		location: { type: String, default: '', maxlength: 160 },
		// Only pending and revoked records expire. Approved records omit this field.
		expiresAt: { type: Date, index: { expires: 0 } },
		approvedAt: Date,
		approvedById: { type: Schema.Types.ObjectId, ref: 'User' },
		lastSeenAt: Date,
		playlistId: { type: Schema.Types.ObjectId, ref: 'MonitorPlaylist' },
		colorMode: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
		refreshVersion: { type: Number, default: 0, min: 0 },
		navigationCommands: {
			type: [
				new Schema(
					{
						id: { type: String, required: true },
						direction: { type: String, enum: ['prev', 'next'], required: true },
						playlistId: { type: String, required: true }
					},
					{ _id: false, id: false }
				)
			],
			default: []
		}
	},
	{ log: false }
);

export const MonitorPairingLimit = defineModel<{ attempts: number; expiresAt: Date }>(
	'MonitorPairingLimit',
	{
		_id: String,
		attempts: { type: Number, default: 0 },
		expiresAt: { type: Date, required: true, index: { expires: 0 } }
	},
	{ log: false }
);
