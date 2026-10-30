import { Node, Extension, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image, { type ImageOptions } from '@tiptap/extension-image';
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
const PostImage = Image.extend<ImageOptions & { resolveSrc: (src: string) => string }>({
	addOptions() {
		return { ...this.parent!(), resolveSrc: (src: string) => src };
	},
	addNodeView() {
		return ({ node }) => {
			const dom = document.createElement('figure'),
				image = document.createElement('img'),
				caption = document.createElement('figcaption');
			dom.append(image, caption);
			image.className = 'inline-block';
			const update = (current: typeof node) => {
				if (current.type.name !== 'image') return false;
				dom.dataset.imageAlign = current.attrs.align;
				image.src = this.options.resolveSrc(current.attrs.src);
				image.alt = current.attrs.alt ?? '';
				image.title = current.attrs.title ?? '';
				image.style.width = `${current.attrs.width ?? 100}%`;
				image.style.maxWidth = '100%';
				image.style.height = 'auto';
				caption.textContent = current.attrs.caption ?? '';
				return true;
			};
			update(node);
			return { dom, update };
		};
	},
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
const LinkAppearance = Extension.create({
	name: 'linkAppearance',
	addOptions: () => ({ buttonClassName: '', textClassName: '' }),
	addGlobalAttributes() {
		return [
			{
				types: ['link'],
				attributes: {
					appearance: {
						default: 'text',
						parseHTML: (element) => element.getAttribute('data-link-appearance') ?? 'text',
						renderHTML: (attributes) => ({
							'data-link-appearance': attributes.appearance,
							class:
								attributes.appearance === 'button'
									? this.options.buttonClassName
									: this.options.textClassName
						})
					}
				}
			}
		];
	}
});
export function editorExtensions(
	componentClassName = '',
	buttonClassName = '',
	textClassName = '',
	resolveSrc: (src: string) => string = (src) => src
) {
	return [
		StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false } }),
		LinkAppearance.configure({ buttonClassName, textClassName }),
		PostImage.configure({ resolveSrc }),
		TableKit.configure({ table: { resizable: false } }),
		TextAlign.configure({ types: ['heading', 'paragraph'] }),
		ComponentBlock.configure({ className: componentClassName })
	];
}
