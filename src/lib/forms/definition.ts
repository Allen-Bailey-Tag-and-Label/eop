export type Audience = 'public' | 'employees' | 'roles';
export type AudienceSettings = { audience: Audience; roleIds: string[] };
export const fieldTypes = ['text', 'email', 'textarea', 'select', 'checkbox', 'rating'] as const;
export type Question = {
	id: string;
	type: (typeof fieldTypes)[number];
	label: string;
	help: string;
	required: boolean;
	options: string[];
	maxLength: number;
};
export type FormDefinition = AudienceSettings & {
	title: string;
	description: string;
	questions: Question[];
	open: boolean;
	anonymous: boolean;
	thanks: string;
};
export type Answers = Record<string, string | number | boolean>;
export class FormValidationError extends Error {}
export const idPattern = /^[a-f0-9]{24}$/i;
export function text(value: unknown, label: string, max = 160, required = true): string {
	if (typeof value !== 'string' || value.length > max || (required && !value.trim()))
		throw new FormValidationError(
			`${label} must ${required ? 'not be blank and ' : ''}be under ${max} characters.`
		);
	return value.trim();
}
export function audienceSettings(input: unknown): AudienceSettings {
	const value = input as Partial<AudienceSettings> | null;
	if (
		!value ||
		!['public', 'employees', 'roles'].includes(String(value.audience)) ||
		!Array.isArray(value.roleIds) ||
		value.roleIds.length > 100 ||
		value.roleIds.some((id) => typeof id !== 'string' || !idPattern.test(id))
	)
		throw new FormValidationError('Choose a valid audience and roles.');
	const audience = value.audience as Audience;
	if (audience === 'roles' && !value.roleIds.length)
		throw new FormValidationError('Select at least one allowed role.');
	return {
		audience,
		roleIds: audience === 'roles' ? [...new Set(value.roleIds.map((id) => id.toLowerCase()))] : []
	};
}
export function blankForm(): FormDefinition {
	return {
		title: 'New form',
		description: '',
		audience: 'public',
		roleIds: [],
		open: true,
		anonymous: true,
		thanks: 'Thank you. Your response has been received.',
		questions: [
			{
				id: crypto.randomUUID(),
				type: 'textarea',
				label: 'Your feedback',
				help: '',
				required: true,
				options: [],
				maxLength: 2000
			}
		]
	};
}
export function validateForm(input: unknown): FormDefinition {
	if (!input || typeof input !== 'object')
		throw new FormValidationError('Invalid form definition.');
	const value = input as FormDefinition;
	const audience = audienceSettings(value);
	if (!Array.isArray(value.questions) || !value.questions.length || value.questions.length > 50)
		throw new FormValidationError('Use between 1 and 50 questions.');
	if (typeof value.open !== 'boolean' || typeof value.anonymous !== 'boolean')
		throw new FormValidationError('Choose open/closed and anonymous/identified settings.');
	const questions = value.questions.map((raw) => {
		if (
			!raw ||
			typeof raw !== 'object' ||
			typeof raw.id !== 'string' ||
			!/^[a-zA-Z0-9_-]{1,80}$/.test(raw.id) ||
			['__proto__', 'constructor', 'prototype'].includes(raw.id) ||
			!fieldTypes.includes(raw.type) ||
			typeof raw.required !== 'boolean'
		)
			throw new FormValidationError('Invalid question type or ID.');
		if (!Number.isInteger(raw.maxLength) || raw.maxLength < 1 || raw.maxLength > 10000)
			throw new FormValidationError('Question text limits must be 1 to 10000 characters.');
		if (!Array.isArray(raw.options) || raw.options.length > 50)
			throw new FormValidationError('Use at most 50 choices.');
		const options = raw.options.map((option) => text(option, 'Choice', 200));
		if (raw.type === 'select' && (!options.length || new Set(options).size !== options.length))
			throw new FormValidationError('Select questions need unique choices.');
		return {
			id: raw.id,
			type: raw.type,
			label: text(raw.label, 'Question label', 300),
			help: text(raw.help, 'Question help', 1000, false),
			required: raw.required,
			options: raw.type === 'select' ? options : [],
			maxLength: raw.maxLength
		};
	});
	if (new Set(questions.map((question) => question.id)).size !== questions.length)
		throw new FormValidationError('Question IDs must be unique.');
	return {
		...audience,
		title: text(value.title, 'Form title'),
		description: text(value.description, 'Description', 4000, false),
		open: value.open,
		anonymous: value.anonymous,
		thanks: text(value.thanks, 'Confirmation message', 1000),
		questions
	};
}
export function validateAnswers(definition: FormDefinition, fields: FormData): Answers {
	const answers: Answers = {};
	for (const question of definition.questions) {
		const raw = fields.get(`answer:${question.id}`);
		if (fields.getAll(`answer:${question.id}`).length > 1)
			throw new FormValidationError('Send one answer per question.');
		if (question.type === 'checkbox') {
			const checked = raw === 'on' || raw === 'true';
			if (raw !== null && !checked)
				throw new FormValidationError(`Invalid answer: ${question.label}.`);
			if (question.required && !checked)
				throw new FormValidationError(`${question.label} is required.`);
			answers[question.id] = checked;
			continue;
		}
		if (raw === null || raw === '') {
			if (question.required) throw new FormValidationError(`${question.label} is required.`);
			answers[question.id] = '';
			continue;
		}
		const answer = text(raw, question.label, question.maxLength, question.required);
		if (question.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer))
			throw new FormValidationError(`Enter a valid email for ${question.label}.`);
		if (question.type === 'select' && !question.options.includes(answer))
			throw new FormValidationError(`Choose an available option for ${question.label}.`);
		if (question.type === 'rating') {
			const rating = Number(answer);
			if (!Number.isInteger(rating) || rating < 1 || rating > 5)
				throw new FormValidationError(`Choose a rating from 1 to 5 for ${question.label}.`);
			answers[question.id] = rating;
		} else answers[question.id] = answer;
	}
	const allowed = new Set(definition.questions.map((question) => `answer:${question.id}`));
	for (const key of fields.keys())
		if (key.startsWith('answer:') && !allowed.has(key))
			throw new FormValidationError(
				'An answer refers to an unavailable question. Reload the form.'
			);
	return answers;
}
export const categoryDefaults: Record<string, Audience> = {
	news: 'public',
	hr: 'employees',
	feedback: 'employees',
	events: 'public'
};
export function embeddedFormSlugs(markdown: string) {
	const slugs = [
		...markdown.matchAll(/<PublishedForm\b[^>]*\bslug=["']([a-z0-9]+(?:-[a-z0-9]+)*)["'][^>]*>/g)
	].map((match) => match[1]);
	return [...new Set(slugs)];
}
export function postUrl(post: { year: number; month: number; day: number; slug: string }) {
	return `/posts/${post.year}/${post.month}/${post.day}/${post.slug}`;
}
