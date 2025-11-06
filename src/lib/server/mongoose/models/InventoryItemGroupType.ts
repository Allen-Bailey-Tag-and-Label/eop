import { defineModel } from '../defineModel';

export const InventoryItemGroupType = defineModel('InventoryItemGroupType', {
	description: { type: String, required: true, unique: true }
});
