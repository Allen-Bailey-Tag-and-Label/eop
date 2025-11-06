import { defineModel } from '../defineModel';

export const InventoryItemGroupType = defineModel('InventoryItemGroupType', {
	code: { type: String, required: true, unique: true },
	description: { type: String, required: true }
});
