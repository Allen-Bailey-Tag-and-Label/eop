import { describe, expect, it } from 'vitest';
import { documentFormSlugs, emptyDocument, validateDocument } from './document';
import { markdownToDocument } from './markdown';
describe('post rich text documents', () => {
	it('preserves component examples inside code instead of turning them into live blocks', () => {
		const source = '<PublishedForm slug="example"></PublishedForm>';
		const doc = markdownToDocument('```html\n' + source + '\n```');
		expect(doc.doc.content?.[0]).toMatchObject({
			type: 'codeBlock',
			content: [{ type: 'text', text: source }]
		});
		expect(documentFormSlugs(doc)).toEqual([]);
	});
	it('converts formatting, nested lists, images, tables and existing question embeds', () => {
		const document = markdownToDocument(
			'# Welcome\n\nA **bold** [link](https://example.com).\n\n- One\n  - Nested\n- Two\n\n![Photo](https://example.com/image.png)\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n<PublishedForm slug="feedback"></PublishedForm>'
		);
		expect(document.doc.content?.map((node) => node.type)).toEqual([
			'heading',
			'paragraph',
			'bulletList',
			'image',
			'table',
			'component'
		]);
		expect(documentFormSlugs(document)).toEqual(['feedback']);
		expect(JSON.stringify(document)).toContain('bold');
	});
	it('does not silently drop custom components, raw HTML or task checkboxes', () => {
		expect(() => markdownToDocument('<Card>Keep me</Card>')).toThrow('cannot be converted');
		expect(() => markdownToDocument('<script>alert(1)</script>')).toThrow();
		expect(() => markdownToDocument('- [x] Done')).toThrow('Task lists');
	});
	it('rejects arbitrary components, invalid nesting and unsafe URLs', () => {
		const doc = (content: unknown[]) => ({ schemaVersion: 1, doc: { type: 'doc', content } });
		expect(() =>
			validateDocument(doc([{ type: 'component', attrs: { name: 'AdminPanel', slug: 'test' } }]))
		).toThrow('registered');
		expect(() => validateDocument(doc([{ type: 'text', text: 'Unwrapped' }]))).toThrow('structure');
		expect(() =>
			validateDocument(
				doc([
					{
						type: 'paragraph',
						content: [
							{
								type: 'text',
								text: 'Link',
								marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }]
							}
						]
					}
				])
			)
		).toThrow('link');
		expect(() =>
			validateDocument(doc([{ type: 'image', attrs: { src: 'data:image/svg+xml,<svg/>' } }]))
		).toThrow('image');
		expect(() =>
			validateDocument(doc([{ type: 'paragraph', attrs: { onclick: 'alert(1)' } }]))
		).toThrow('settings');
	});
	it('supports empty documents and bounds payload size', () => {
		expect(validateDocument(emptyDocument()).schemaVersion).toBe(1);
		expect(() => validateDocument({ schemaVersion: 2, doc: { type: 'doc' } })).toThrow('supported');
		expect(() =>
			validateDocument({
				schemaVersion: 1,
				doc: {
					type: 'doc',
					content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x'.repeat(200001) }] }]
				}
			})
		).toThrow('200 KB');
	});
});
