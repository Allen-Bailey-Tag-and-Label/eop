import { defineModel } from '../defineModel';

export const Post = defineModel('Post', {
	category: { type: String, required: true },
	date: { type: Date, required: true },
	md: { type: String, required: true },
	slug: { type: String, required: true },
	tags: [{ type: String }],
	title: { type: String, required: true }
});
