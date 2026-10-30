import { Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';

// Only registered application components can be stored in post documents.
export const ComponentBlock = Node.create({
	name: 'component',
	group: 'block',
	atom: true,
	draggable: true,
	addOptions: () => ({ className: '' }),
	addAttributes: () => ({ name: { default: 'PublishedForm' }, slug: { default: '' } }),
	parseHTML: () => [
		{
			tag: 'div[data-post-component]',
			getAttrs: (element) => ({
				name: element.getAttribute('data-post-component'),
				slug: element.getAttribute('data-slug')
			})
		}
	],
	renderHTML({ node }) {
		return [
			'div',
			{
				'data-post-component': node.attrs.name,
				'data-slug': node.attrs.slug,
				class: this.options.className
			},
			`Questions: ${node.attrs.slug}`
		];
	}
});
const PostImage = Image.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			width: {
				default: 100,
				parseHTML: (element) => Number(element.getAttribute('data-width') ?? 100)
			},
			align: {
				default: 'center',
				parseHTML: (element) =>
					element.closest('figure')?.getAttribute('data-image-align') ?? 'center'
			},
			caption: {
				default: '',
				parseHTML: (element) =>
					element.closest('figure')?.querySelector('figcaption')?.textContent ?? ''
			}
		};
	},
	parseHTML: () => [{ tag: 'img[src]' }],
	renderHTML({ HTMLAttributes }) {
		const { width, align, caption, ...attributes } = HTMLAttributes;
		return [
			'figure',
			{ 'data-image-align': align },
			[
				'img',
				mergeAttributes(attributes, {
					'data-width': width,
					class: 'inline-block',
					style: `width:${width}%;max-width:100%;height:auto`
				})
			],
			['figcaption', {}, caption || '']
		];
	}
});
export function editorExtensions(componentClassName = '') {
	return [
		StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false } }),
		PostImage,
		TableKit.configure({ table: { resizable: false } }),
		TextAlign.configure({ types: ['heading', 'paragraph'] }),
		ComponentBlock.configure({ className: componentClassName })
	];
}
