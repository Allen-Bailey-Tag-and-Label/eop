import { describe, expect, it } from 'vitest';
import {
	audienceSettings,
	blankForm,
	validateForm,
	validateAnswers,
	embeddedFormSlugs,
	postUrl
} from './definition';
describe('post form definitions', () => {
	it('validates definitions and requires selected roles', () => {
		expect(validateForm(blankForm()).questions).toHaveLength(1);
		expect(() => audienceSettings({ audience: 'roles', roleIds: [] })).toThrow('at least one');
		expect(() => validateForm({ ...blankForm(), questions: [] })).toThrow('1 and 50');
		const definition = blankForm();
		definition.questions[0].id = '__proto__';
		expect(() => validateForm(definition)).toThrow('Invalid question');
	});
	it('validates each answer type and never accepts unlisted fields/options', () => {
		const definition = blankForm();
		definition.questions = [
			{
				id: 'email',
				type: 'email',
				label: 'Email',
				help: '',
				required: true,
				options: [],
				maxLength: 200
			},
			{
				id: 'select',
				type: 'select',
				label: 'Department',
				help: '',
				required: true,
				options: ['Office', 'Plant'],
				maxLength: 100
			},
			{
				id: 'rating',
				type: 'rating',
				label: 'Rating',
				help: '',
				required: false,
				options: [],
				maxLength: 10
			},
			{
				id: 'agree',
				type: 'checkbox',
				label: 'Agree',
				help: '',
				required: true,
				options: [],
				maxLength: 10
			}
		];
		const fields = new FormData();
		fields.set('answer:email', 'me@example.com');
		fields.set('answer:select', 'Plant');
		fields.set('answer:rating', '5');
		fields.set('answer:agree', 'on');
		expect(validateAnswers(definition, fields)).toEqual({
			email: 'me@example.com',
			select: 'Plant',
			rating: 5,
			agree: true
		});
		fields.set('answer:select', 'Unknown');
		expect(() => validateAnswers(definition, fields)).toThrow('available option');
		fields.set('answer:select', 'Plant');
		fields.set('answer:rating', '6');
		expect(() => validateAnswers(definition, fields)).toThrow('1 to 5');
		fields.set('answer:rating', '5');
		fields.set('answer:private', 'injected');
		expect(() => validateAnswers(definition, fields)).toThrow('unavailable question');
	});
	it('extracts reusable form references and uses category-independent post URLs', () => {
		expect(
			embeddedFormSlugs(
				'<PublishedForm slug="feedback"></PublishedForm>\n<PublishedForm slug="feedback"/>'
			)
		).toEqual(['feedback']);
		expect(postUrl({ year: 2026, month: 10, day: 30, slug: 'feedback' })).toBe(
			'/posts/2026/10/30/feedback'
		);
	});
});
