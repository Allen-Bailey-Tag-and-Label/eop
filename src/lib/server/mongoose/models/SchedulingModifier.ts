import { defineModel } from '../defineModel';

export const SchedulingModifier = defineModel('SchedulingModifier', {
	businessDays: { type: Number, required: true },
	description: { type: String, required: true }
});
