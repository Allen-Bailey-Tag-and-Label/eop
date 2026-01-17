import { Types } from 'mongoose';
import { defineModel } from '../defineModel';

export const CustomerActivity = defineModel('CustomerActivity', {
	_contactId: { type: Types.ObjectId, ref: 'CustomerContact' },
	_customerId: { type: Types.ObjectId, ref: 'Customer' },
	_directionId: { type: Types.ObjectId, ref: 'CustomerActivityDirection' },
	_salesOpportunityId: { type: Types.ObjectId, ref: 'SalesOpportunity' },
	_typeId: { type: Types.ObjectId, ref: 'CustomerActivityType' },
	body: { type: String },
	subject: { type: String }
});
