import { Schema, model, Types } from 'mongoose';
import { attachLogging } from './middleware';

const _createdById = { type: Types.ObjectId, ref: 'User', required: false };
const schemaOptions = {
	timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
};

// === Log ===
const LogSchema = new Schema(
	{
		_createdById,
		data: {},
		model: { type: String, required: true },
		operation: { type: String, required: true }
	},
	schemaOptions
);
export const Log = model('Log', LogSchema);

// === Role ===
const RoleSchema = new Schema(
	{
		_createdById,
		label: { type: String, required: true, unique: true },
		routes: [{ type: Types.ObjectId, ref: 'Route' }]
	},
	schemaOptions
);
attachLogging(RoleSchema, 'Role');
export const Role = model('Role', RoleSchema);

// === Route ===
const RouteSchema = new Schema(
	{
		_createdById,
		_parentId: { type: Types.ObjectId, ref: 'Route' },
		href: String,
		isDirectory: { type: Boolean, default: false },
		label: { type: String, required: true }
	},
	schemaOptions
);
attachLogging(RouteSchema, 'Route');
export const Route = model('Route', RouteSchema);

// === UPS Quote ===
const UpsQuoteSchema = new Schema(
	{
		_createdById,
		classification: { type: String, required: true },
		packageTotalCount: { type: Number, required: true },
		packageTotalWeight: { type: Number, required: true },
		packageWeight: { type: Number, required: true },
		quote: { type: Number, required: true },
		rates: { type: [Schema.Types.Mixed], required: true },
		shipper: { type: Schema.Types.Mixed, required: true },
		shipTo: { type: Schema.Types.Mixed, required: true }
	},
	schemaOptions
);
attachLogging(UpsQuoteSchema, 'UpsQuote');
export const UpsQuote = model('UpsQuote', UpsQuoteSchema);

// === User ===
const UserSchema = new Schema(
	{
		_createdById,
		isActive: { type: Boolean, default: false },
		passwordHash: { type: String, required: true },
		roles: [{ type: Types.ObjectId, ref: 'Role' }],
		username: { type: String, required: true, unique: true }
	},
	schemaOptions
);
attachLogging(UserSchema, 'User');
export const User = model('User', UserSchema);
