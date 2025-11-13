import { defineModel } from '../defineModel';

export const Holiday = defineModel('Holiday', {
	date: { type: Date, required: true }
});
