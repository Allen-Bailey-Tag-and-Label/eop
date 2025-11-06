import { defineModel } from '../defineModel';

export const InventoryItemUOM = defineModel('InventoryItemUOM', {
	code: { type: String, required: true, unique: true },
	description: { type: String, required: true }
});
