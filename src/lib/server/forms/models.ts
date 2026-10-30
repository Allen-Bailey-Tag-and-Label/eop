import { Schema, type Types } from 'mongoose';
import { defineModel } from '../mongoose/defineModel';
import type { FormDefinition, Answers } from '$lib/forms/definition';
export type FormRecord = {
	_id: Types.ObjectId;
	slug: string;
	title: string;
	version: number;
	draft: FormDefinition;
	published?: FormDefinition;
	publishedVersion?: number;
};
export const PublishedForm = defineModel<FormRecord>('PublishedForm', {
	slug: { type: String, required: true, unique: true },
	title: { type: String, required: true },
	version: { type: Number, required: true },
	draft: { type: Schema.Types.Mixed, required: true },
	published: Schema.Types.Mixed,
	publishedVersion: Number
});
export type SubmissionRecord = {
	_id: Types.ObjectId;
	formId: Types.ObjectId;
	formVersion: number;
	definition: FormDefinition;
	answers: Answers;
	postId?: Types.ObjectId;
	respondentId?: Types.ObjectId;
	token: string;
	createdAt: Date;
};
// Answers, including anonymous submissions, must not enter generic CRUD or operation logs.
export const FormSubmission = defineModel<SubmissionRecord>(
	'FormSubmission',
	{
		formId: { type: Schema.Types.ObjectId, required: true, index: true },
		formVersion: { type: Number, required: true },
		definition: { type: Schema.Types.Mixed, required: true },
		answers: { type: Schema.Types.Mixed, required: true },
		postId: Schema.Types.ObjectId,
		respondentId: { type: Schema.Types.ObjectId, ref: 'User' },
		token: { type: String, required: true, unique: true }
	},
	{ log: false }
);
