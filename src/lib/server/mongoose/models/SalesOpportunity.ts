import { Types } from 'mongoose';
import { defineModel } from '../defineModel';

export const SalesOpportunity = defineModel('SalesOpportunity', {
	_customerId: { type: Types.ObjectId, ref: 'Customer' },
	_customerContactId: { type: Types.ObjectId, ref: 'CustomerContact' },
	_statusId: { type: Types.ObjectId, ref: 'SalesOpportunityStatus' },
	description: { type: String, default: '' }
});
