import { Schema, type Types } from 'mongoose';
import { defineModel } from '../mongoose/defineModel';

export type MonitorRecord = {
	_id: Types.ObjectId;
	tokenHash: string;
	pairingCode?: string;
	status: 'pending' | 'approved' | 'revoked';
	location: string;
	expiresAt: Date;
	approvedAt?: Date;
	approvedById?: Types.ObjectId;
	lastSeenAt?: Date;
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
		expiresAt: { type: Date, required: true, index: { expires: 0 } },
		approvedAt: Date,
		approvedById: { type: Schema.Types.ObjectId, ref: 'User' },
		lastSeenAt: Date
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
