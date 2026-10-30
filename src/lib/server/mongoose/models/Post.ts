import { Schema, type Types } from 'mongoose';
import { defineModel } from '../defineModel';

export type PostRecord = {
	_id: Types.ObjectId;
	_createdById?: Types.ObjectId;
	category: string;
	day: number;
	month: number;
	year: number;
	md: string;
	slug: string;
	tags?: string[];
	title: string;
	audience?: import('$lib/forms/definition').Audience;
	roleIds?: Types.ObjectId[];
	formIds?: Types.ObjectId[];
	createdAt?: Date;
};
export const Post = defineModel<PostRecord>('Post', {
	audience: { type: String, enum: ['public', 'employees', 'roles'], default: 'public' },
	roleIds: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
	formIds: [{ type: Schema.Types.ObjectId, ref: 'PublishedForm' }],
	category: { type: String, required: true },
	day: { type: Number, required: true },
	md: { type: String, required: true },
	month: { type: Number, required: true },
	slug: { type: String, required: true },
	tags: [{ type: String }],
	title: { type: String, required: true },
	year: { type: Number, required: true }
});
