import { Schema, model, Types } from 'mongoose';

// === Role ===
const RoleSchema = new Schema({
	label: { type: String, required: true, unique: true }
});
export const Role = model('Role', RoleSchema);

// === Route ===
const RouteSchema = new Schema({
	href: String,
	isDirectory: { type: Boolean, default: false },
	label: { type: String, required: true },
	parentId: { type: Types.ObjectId, ref: 'Route' }
});
export const Route = model('Route', RouteSchema);

// === UPS Quote ===
const UpsQuoteSchema = new Schema({
	classification: { type: String, required: true },
	date: { type: Date, required: true },
	packageTotalCount: { type: Number, required: true },
	packageTotalWeight: { type: Number, required: true },
	packageWeight: { type: Number, required: true },
	quote: { type: Number, required: true },
	rates: { type: [Schema.Types.Mixed], required: true },
	shipper: { type: Schema.Types.Mixed, required: true },
	shipTo: { type: Schema.Types.Mixed, required: true }
});
export const UpsQuote = model('UpsQuote', UpsQuoteSchema);

// === User ===
const UserSchema = new Schema({
	username: { type: String, required: true, unique: true },
	passwordHash: { type: String, required: true },
	isActive: { type: Boolean, default: false },
	roles: [{ type: Types.ObjectId, ref: 'Role' }]
});
export const User = model('User', UserSchema);

// === Role ↔ Route many-to-many ===
RoleSchema.add({
	routes: [{ type: Types.ObjectId, ref: 'Route' }]
});
