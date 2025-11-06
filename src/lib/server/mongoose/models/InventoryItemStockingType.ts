import { defineModel } from '../defineModel';

export const InventoryItemStockingType = defineModel('InventoryItemStockingType', {
	code: { type: String, required: true, unique: true },
	description: { type: String, required: true }
});
