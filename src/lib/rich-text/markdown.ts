import { marked } from 'marked';
import type { JSONContent } from '@tiptap/core';
import { validateDocument, RichTextError, type RichTextDocument } from './document';
type Token = {
	type: string;
	raw?: string;
	text?: string;
	depth?: number;
	href?: string;
	title?: string;
	ordered?: boolean;
	start?: number;
	lang?: string;
	tokens?: Token[];
	items?: Token[];
	task?: boolean;
	header?: { tokens: Token[] }[];
	rows?: { tokens: Token[] }[][];
	align?: (string | null)[];
};
const decode = (value = '') =>
	value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (match, entity: string) => {
		if (entity.startsWith('#')) {
			const code =
				entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
			return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
		}
		return (
			({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" } as Record<string, string>)[
				entity.toLowerCase()
			] ?? match
		);
	});
export function markdownToDocument(markdown: string): RichTextDocument {
	function blocks(nodes: JSONContent[]): JSONContent[] {
		const output: JSONContent[] = [];
		let inline: JSONContent[] = [];
		const flush = () => {
			if (inline.length) {
				output.push({ type: 'paragraph', content: inline });
				inline = [];
			}
		};
		for (const node of nodes) {
			if (['text', 'hardBreak'].includes(node.type ?? '')) inline.push(node);
			else {
				flush();
				output.push(node);
			}
		}
		flush();
		return output;
	}
	const source = markdown;
	const question = (text = '') =>
		text
			.trim()
			.match(/^<PublishedForm\s+slug=["']([a-z0-9-]+)["']\s*(?:\/>|>\s*<\/PublishedForm>)$/);
	function convert(tokens: Token[], inline = false): JSONContent[] {
		return tokens.flatMap((token): JSONContent[] => {
			const children = () => convert(token.tokens ?? []);
			const markedChildren = (type: string, attrs?: Record<string, unknown>) =>
				convert(token.tokens ?? [{ type: 'text', text: token.text }], true).map((node) => ({
					...node,
					marks: [...(node.marks ?? []), { type, ...(attrs ? { attrs } : {}) }]
				}));
			switch (token.type) {
				case 'space':
					return [];
				case 'paragraph': {
					const match = question(token.text);
					if (match)
						return [{ type: 'component', attrs: { name: 'PublishedForm', slug: match[1] } }];
					return blocks(convert(token.tokens ?? [], true));
				}
				case 'heading':
					return [
						{
							type: 'heading',
							attrs: { level: token.depth },
							content: convert(token.tokens ?? [], true)
						}
					];
				case 'text':
				case 'escape':
					return token.tokens
						? convert(token.tokens, inline)
						: token.text
							? [{ type: 'text', text: decode(token.text) }]
							: [];
				case 'strong':
					return markedChildren('bold');
				case 'em':
					return markedChildren('italic');
				case 'del':
					return markedChildren('strike');
				case 'codespan':
					return [{ type: 'text', text: decode(token.text), marks: [{ type: 'code' }] }];
				case 'link':
					return markedChildren('link', { href: token.href });
				case 'image':
					return [
						{
							type: 'image',
							attrs: { src: token.href, alt: decode(token.text), title: token.title ?? null }
						}
					];
				case 'br':
					return [{ type: 'hardBreak' }];
				case 'hr':
					return [{ type: 'horizontalRule' }];
				case 'code':
					return [
						{
							type: 'codeBlock',
							attrs: { language: token.lang ?? null },
							...(token.text ? { content: [{ type: 'text', text: token.text }] } : {})
						}
					];
				case 'blockquote':
					return [{ type: 'blockquote', content: children() }];
				case 'list':
					return [
						{
							type: token.ordered ? 'orderedList' : 'bulletList',
							...(token.ordered ? { attrs: { start: token.start ?? 1 } } : {}),
							content: (token.items ?? []).map((item) => {
								if (item.task)
									throw new RichTextError(
										'Task lists need review before conversion. Keep the original Markdown.'
									);
								const content = convert(item.tokens ?? []);
								return {
									type: 'listItem',
									content: blocks(content)
								};
							})
						}
					];
				case 'table':
					return [
						{
							type: 'table',
							content: [
								{
									type: 'tableRow',
									content: (token.header ?? []).map((cell, index) => ({
										type: 'tableHeader',
										content: [
											{
												type: 'paragraph',
												attrs: { textAlign: token.align?.[index] ?? null },
												content: convert(cell.tokens, true)
											}
										]
									}))
								},
								...(token.rows ?? []).map((row) => ({
									type: 'tableRow',
									content: row.map((cell, index) => ({
										type: 'tableCell',
										content: [
											{
												type: 'paragraph',
												attrs: { textAlign: token.align?.[index] ?? null },
												content: convert(cell.tokens, true)
											}
										]
									}))
								}))
							]
						}
					];
				case 'html': {
					const match = question(token.text);
					if (match)
						return [{ type: 'component', attrs: { name: 'PublishedForm', slug: match[1] } }];
					throw new RichTextError(
						'This Markdown contains HTML or components that cannot be converted safely. Keep Markdown mode or simplify a copy first.'
					);
				}
				default:
					throw new RichTextError(
						`Markdown ${token.type} content needs review before conversion. Your original Markdown has been preserved.`
					);
			}
		});
	}
	let content = convert(marked.lexer(source) as unknown as Token[]);
	if (!content.length) content = [{ type: 'paragraph' }];
	return validateDocument({ schemaVersion: 1, doc: { type: 'doc', content } });
}
