import { defineModel } from '../defineModel';

export const SchedulingProductType = defineModel('SchedulingProductType', {
	businessDays: { type: Number, required: true },
	description: { type: String, required: true }
});
