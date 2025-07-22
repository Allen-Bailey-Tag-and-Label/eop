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
	classification: String,
	date: Date,
	packageTotalCount: Number,
	packageTotalWeight: Number,
	packageWeight: Number,
	quote: Number,
	rates: [Schema.Types.Mixed],
	shipper: Schema.Types.Mixed,
	shipTo: Schema.Types.Mixed
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
