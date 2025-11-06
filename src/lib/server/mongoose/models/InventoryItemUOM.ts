import { defineModel } from '../defineModel';

export const InventoryItemUOM = defineModel('InventoryItemUOM', {
	description: { type: String, required: true, unique: true }
});
