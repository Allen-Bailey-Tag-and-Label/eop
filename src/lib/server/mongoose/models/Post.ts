import { defineModel } from '../defineModel';

export const Post = defineModel('Post', {
	category: { type: String, required: true },
	day: { type: Number, required: true },
	md: { type: String, required: true },
	month: { type: Number, required: true },
	slug: { type: String, required: true },
	tags: [{ type: String }],
	title: { type: String, required: true },
	year: { type: Number, required: true }
});
