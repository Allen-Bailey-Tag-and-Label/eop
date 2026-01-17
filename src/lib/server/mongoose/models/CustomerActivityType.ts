import { defineModel } from '../defineModel';

export const CustomerActivityType = defineModel('CustomerActivityType', {
	label: { type: String, required: true }
});
