import { defineModel } from '../defineModel';

export const InventoryItemLineType = defineModel('InventoryItemLineType', {
	code: { type: String, required: true, unique: true },
	description: { type: String, required: true }
});
