import { getSchema, type JSONContent } from '@tiptap/core';
import { editorExtensions } from './extensions';
import { textColor, textSize } from './formatting';
export type RichTextDocument = { schemaVersion: 1; doc: JSONContent };
export class RichTextError extends Error {}
export const emptyDocument = (): RichTextDocument => ({
	schemaVersion: 1,
	doc: { type: 'doc', content: [{ type: 'paragraph' }] }
});
export function safeUrl(value: unknown, image = false): value is string {
	if (
		typeof value !== 'string' ||
		!value ||
		value.length > 2048 ||
		/[\s\\]/.test(value) ||
		Array.from(value).some((character) => character.charCodeAt(0) < 32)
	)
		return false;
	if (/^\/(?!\/)/.test(value)) return true;
	if (!image && /^(#|mailto:|tel:)/i.test(value)) return true;
	try {
		return ['http:', 'https:'].includes(new URL(value).protocol);
	} catch {
		return false;
	}
}
const attributes: Record<string, string[]> = {
	paragraph: ['textAlign'],
	heading: ['level', 'textAlign'],
	orderedList: ['start', 'type'],
	codeBlock: ['language'],
	image: ['src', 'alt', 'title', 'width', 'height', 'align', 'caption'],
	component: ['name', 'slug'],
	tableCell: ['colspan', 'rowspan', 'colwidth', 'align'],
	tableHeader: ['colspan', 'rowspan', 'colwidth', 'align']
};
export function validateDocument(input: unknown): RichTextDocument {
	let serialized = '';
	try {
		serialized = JSON.stringify(input);
	} catch {
		throw new RichTextError('The document is too complex.');
	}
	if (
		!input ||
		typeof input !== 'object' ||
		(input as RichTextDocument).schemaVersion !== 1 ||
		serialized.length > 200000
	)
		throw new RichTextError('Use a supported rich text document under 200 KB.');
	const doc = (input as RichTextDocument).doc;
	let count = 0;
	function visit(node: JSONContent, depth: number) {
		if (
			!node ||
			typeof node !== 'object' ||
			typeof node.type !== 'string' ||
			depth > 24 ||
			++count > 5000
		)
			throw new RichTextError('The document is too complex.');
		if (
			Object.keys(node).some((key) => !['type', 'attrs', 'content', 'text', 'marks'].includes(key))
		)
			throw new RichTextError('Unsupported document properties.');
		if (
			node.attrs != null &&
			(typeof node.attrs !== 'object' ||
				Array.isArray(node.attrs) ||
				Object.keys(node.attrs).some((key) => !(attributes[node.type!] ?? []).includes(key)))
		)
			throw new RichTextError(`Unsupported ${node.type} settings.`);
		const attrs = node.attrs ?? {};
		if (
			attrs.textAlign != null &&
			!['left', 'center', 'right', 'justify'].includes(attrs.textAlign)
		)
			throw new RichTextError('Invalid text alignment.');
		if (
			['tableCell', 'tableHeader'].includes(node.type) &&
			attrs.align != null &&
			!['left', 'center', 'right', 'justify'].includes(attrs.align)
		)
			throw new RichTextError('Invalid cell alignment.');
		if (node.type === 'heading' && ![1, 2, 3].includes(attrs.level))
			throw new RichTextError('Use heading levels 1 to 3.');
		if (
			node.type === 'image' &&
			attrs.height != null &&
			(!Number.isInteger(attrs.height) || attrs.height < 1 || attrs.height > 10000)
		)
			throw new RichTextError('Invalid image height.');
		if (
			node.type === 'orderedList' &&
			attrs.start != null &&
			(!Number.isInteger(attrs.start) || attrs.start < 1 || attrs.start > 100000)
		)
			throw new RichTextError('Invalid list numbering.');
		if (
			node.type === 'component' &&
			(attrs.name !== 'PublishedForm' ||
				typeof attrs.slug !== 'string' ||
				!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(attrs.slug) ||
				attrs.slug.length > 100)
		)
			throw new RichTextError('Choose a registered post component and valid question set.');
		if (
			node.type === 'image' &&
			(!safeUrl(attrs.src, true) ||
				!Number.isInteger(attrs.width ?? 100) ||
				(attrs.width ?? 100) < 10 ||
				(attrs.width ?? 100) > 100 ||
				!['left', 'center', 'right'].includes(attrs.align ?? 'center'))
		)
			throw new RichTextError(
				'Choose an HTTP(S) image or a site image path, width 10–100%, and valid alignment.'
			);
		for (const key of ['alt', 'title', 'caption', 'language'])
			if (attrs[key] != null && (typeof attrs[key] !== 'string' || attrs[key].length > 1000))
				throw new RichTextError(`Invalid ${key}.`);
		for (const key of ['colspan', 'rowspan'])
			if (
				attrs[key] != null &&
				(!Number.isInteger(attrs[key]) || attrs[key] < 1 || attrs[key] > 20)
			)
				throw new RichTextError('Table spans must be 1–20.');
		if (
			attrs.colwidth != null &&
			(!Array.isArray(attrs.colwidth) ||
				attrs.colwidth.length > 20 ||
				attrs.colwidth.some(
					(value: unknown) => !Number.isInteger(value) || Number(value) < 0 || Number(value) > 4000
				))
		)
			throw new RichTextError('Invalid table widths.');
		if (node.text != null && typeof node.text !== 'string')
			throw new RichTextError('Invalid document text.');
		if (node.marks != null && !Array.isArray(node.marks))
			throw new RichTextError('Invalid text formatting.');
		for (const mark of node.marks ?? []) {
			if (
				!mark ||
				typeof mark !== 'object' ||
				!['bold', 'italic', 'underline', 'strike', 'code', 'link', 'textStyle'].includes(
					mark.type
				) ||
				Object.keys(mark).some((key) => !['type', 'attrs'].includes(key))
			)
				throw new RichTextError('Unsupported text formatting.');
			if (
				mark.attrs &&
				(typeof mark.attrs !== 'object' ||
					Object.keys(mark.attrs).some(
						(key) =>
							!(
								mark.type === 'link'
									? ['href', 'target', 'rel', 'class', 'title', 'appearance']
									: mark.type === 'textStyle'
										? ['fontSize', 'color', 'backgroundColor']
										: []
							).includes(key)
					))
			)
				throw new RichTextError('Unsupported formatting settings.');
			if (mark.type === 'textStyle') {
				if (mark.attrs?.fontSize != null && !textSize(mark.attrs.fontSize))
					throw new RichTextError('Text size must be 8–200 pixels.');
				for (const key of ['color', 'backgroundColor'])
					if (mark.attrs?.[key] != null && !textColor(mark.attrs[key]))
						throw new RichTextError('Choose a valid text or highlight color.');
			}
			if (mark.type === 'link' && !safeUrl(mark.attrs?.href))
				throw new RichTextError('Use an HTTP(S), email, telephone, or site link.');
			if (
				mark.type === 'link' &&
				mark.attrs?.title != null &&
				(typeof mark.attrs.title !== 'string' || mark.attrs.title.length > 1000)
			)
				throw new RichTextError('Invalid link title.');
			if (
				mark.type === 'link' &&
				mark.attrs?.appearance != null &&
				!['text', 'button'].includes(mark.attrs.appearance)
			)
				throw new RichTextError('Choose text or button link appearance.');
		}
		if (node.content != null && !Array.isArray(node.content))
			throw new RichTextError('Invalid document children.');
		for (const child of node.content ?? []) visit(child, depth + 1);
	}
	visit(doc, 0);
	if (doc.type !== 'doc') throw new RichTextError('Invalid document root.');
	try {
		const parsed = getSchema(editorExtensions()).nodeFromJSON(doc);
		parsed.check();
		return { schemaVersion: 1, doc: parsed.toJSON() };
	} catch {
		throw new RichTextError('Unsupported or invalid content structure.');
	}
}
export function documentFormSlugs(document: RichTextDocument): string[] {
	const slugs = new Set<string>();
	function visit(node: JSONContent) {
		if (node.type === 'component') slugs.add(node.attrs?.slug);
		for (const child of node.content ?? []) visit(child);
	}
	visit(document.doc);
	return [...slugs];
}
