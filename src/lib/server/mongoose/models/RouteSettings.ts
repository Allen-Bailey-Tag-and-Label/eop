import { Schema, Types } from 'mongoose';
import { defineModel } from '../defineModel';

export const RouteSettings = defineModel('RouteSettings', {
	_routeId: { type: Types.ObjectId, ref: 'Route', required: true },
	_userId: { type: Types.ObjectId, ref: 'User', required: true },
	columnsOrder: { type: [String], default: [] },
	currentPage: { type: Number, default: 0 },
	filter: { type: Schema.Types.Mixed, default: {} },
	isPaginateable: { type: Boolean, required: true },
	rowsPerPage: { type: Number, default: 10 },
	sortDirection: { type: String, enum: ['asc', 'desc'], default: 'asc' },
	sortKey: { type: String, default: 'createdAt' }
});
