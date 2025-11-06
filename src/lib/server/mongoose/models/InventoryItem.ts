import { Types } from 'mongoose';
import { defineModel } from '../defineModel';

export const InventoryItem = defineModel('InventoryItem', {
	cost07: { type: Number, required: true },
	costPU: { type: Number, required: true },
	costQT: { type: Number, required: true },
	description: { type: String, required: true },
	groupType: { type: Types.ObjectId, ref: 'InventoryItemGroupType' },
	lineType: { type: Types.ObjectId, ref: 'InventoryItemLineType' },
	number: { type: String, required: true, unique: true },
	primaryUOM: { type: Types.ObjectId, ref: 'InventoryItemUOM' },
	stockingType: { type: Types.ObjectId, ref: 'InventoryItemStockingType' }
});
