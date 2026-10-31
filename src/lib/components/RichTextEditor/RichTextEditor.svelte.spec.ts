import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, fireEvent, waitFor, within } from '@testing-library/svelte';
import RichTextEditor from './RichTextEditor.svelte';
import RichTextRenderer from '../RichTextRenderer/RichTextRenderer.svelte';
import { emptyDocument, validateDocument, type RichTextDocument } from '$lib/rich-text/document';
vi.mock('sveltewind/transitions', () => ({ subtleReveal: () => ({ duration: 0 }) }));
beforeEach(() => {
	const opened = new WeakSet<HTMLElement>();
	vi.stubGlobal('CSS', { supports: () => false });
	const matches = HTMLElement.prototype.matches;
	vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (
		this: HTMLElement,
		selector
	) {
		return selector === ':popover-open' ? opened.has(this) : matches.call(this, selector);
	});
	Object.defineProperties(HTMLElement.prototype, {
		showPopover: {
			configurable: true,
			value: function () {
				opened.add(this);
			}
		},
		hidePopover: {
			configurable: true,
			value: function () {
				opened.delete(this);
			}
		}
	});
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			disconnect() {}
			unobserve() {}
		}
	);
	Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value: () => [] });
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
	Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
});
describe('shared rich text editor', () => {
	it('groups the toolbar and edits persistent sizes, colors, headings and alignment', async () => {
		const onChange = vi.fn();
		const onInsertComponent = vi.fn();
		const view = render(RichTextEditor, {
			value: {
				schemaVersion: 1,
				doc: {
					type: 'doc',
					content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Styled text' }] }]
				}
			},
			onChange,
			onInsertComponent
		});
		const toolbar = within(view.getByRole('toolbar', { name: 'Text formatting' }));
		expect(toolbar.getAllByRole('group').map((group) => group.getAttribute('aria-label'))).toEqual([
			'History',
			'Text style and size',
			'Text styling',
			'Text alignment',
			'Lists',
			'Links, images and tables',
			'Questions'
		]);
		expect(
			toolbar
				.getAllByRole('button')
				.slice(0, 2)
				.map((button) => button.getAttribute('aria-label'))
		).toEqual(['Undo', 'Redo']);
		await fireEvent.click(toolbar.getByRole('button', { name: 'Questions' }));
		expect(onInsertComponent).toHaveBeenCalledOnce();
		const textbox = view.getByRole('textbox', { name: 'Rich text content' });
		await fireEvent.keyDown(textbox, { key: 'a', ctrlKey: true });
		await fireEvent.click(toolbar.getByRole('button', { name: 'Bold' }));
		await fireEvent.change(toolbar.getByRole('spinbutton', { name: 'Font size (px)' }), {
			target: { value: '32' }
		});
		await fireEvent.click(toolbar.getByRole('button', { name: 'Font color' }));
		await fireEvent.change(view.getByLabelText('Font color', { selector: 'input' }), {
			target: { value: '#123456' }
		});
		await fireEvent.click(toolbar.getByRole('button', { name: 'Highlight color' }));
		await fireEvent.change(view.getByLabelText('Highlight color', { selector: 'input' }), {
			target: { value: '#fef08a' }
		});
		await fireEvent.click(toolbar.getByRole('button', { name: 'Text style' }));
		await fireEvent.click(view.getByRole('menuitemradio', { name: 'Heading 2' }));
		await fireEvent.click(toolbar.getByRole('button', { name: 'Text alignment' }));
		await fireEvent.click(view.getByRole('menuitemradio', { name: 'Align center' }));
		const saved = validateDocument(onChange.mock.calls.at(-1)![0]);
		expect(saved.doc.content?.[0]).toMatchObject({
			type: 'heading',
			attrs: { level: 2, textAlign: 'center' }
		});
		expect(saved.doc.content?.[0].content?.[0].marks).toContainEqual({
			type: 'textStyle',
			attrs: {
				fontSize: '32px',
				color: '#123456',
				backgroundColor: '#fef08a'
			}
		});
		const published = render(RichTextRenderer, { value: saved });
		const text = within(published.container)
			.getByRole('heading', { name: 'Styled text' })
			.querySelector('span');
		expect(text).toHaveStyle({ fontSize: '32px', color: '#123456', backgroundColor: '#fef08a' });
		expect(text?.parentElement?.localName).toBe('strong');
		await fireEvent.click(toolbar.getByRole('button', { name: 'Font color' }));
		await fireEvent.click(view.getByRole('button', { name: 'Default font color' }));
		await fireEvent.click(toolbar.getByRole('button', { name: 'Highlight color' }));
		await fireEvent.click(view.getByRole('button', { name: 'Remove highlight' }));
		await fireEvent.change(toolbar.getByRole('spinbutton', { name: 'Font size (px)' }), {
			target: { value: '' }
		});
		expect(JSON.stringify(onChange.mock.calls.at(-1)![0])).not.toContain('textStyle');
	});
	it('creates and edits tables through a dialog without adding toolbar controls', async () => {
		const onChange = vi.fn();
		const view = render(RichTextEditor, { value: emptyDocument(), onChange });
		const toolbar = within(view.getByRole('toolbar', { name: 'Text formatting' }));
		const count = toolbar.getAllByRole('button').length;
		await fireEvent.click(toolbar.getByRole('button', { name: 'Table settings' }));
		let dialog = within(view.getByRole('dialog', { name: 'Table settings' }));
		await fireEvent.input(dialog.getByRole('spinbutton', { name: 'Table rows' }), {
			target: { value: '2' }
		});
		await fireEvent.input(dialog.getByRole('spinbutton', { name: 'Table columns' }), {
			target: { value: '2' }
		});
		await fireEvent.click(dialog.getByRole('button', { name: 'Insert table' }));
		await waitFor(() => expect(onChange).toHaveBeenCalled());
		const table = () =>
			(onChange.mock.calls.at(-1)![0] as RichTextDocument).doc.content?.find(
				(node) => node.type === 'table'
			);
		expect(table()?.content).toHaveLength(2);
		expect(table()?.content?.[0].content).toHaveLength(2);
		expect(toolbar.getAllByRole('button')).toHaveLength(count);
		expect(toolbar.queryByRole('button', { name: 'Add row' })).not.toBeInTheDocument();
		await fireEvent.click(toolbar.getByRole('button', { name: 'Table settings' }));
		dialog = within(view.getByRole('dialog', { name: 'Table settings' }));
		await fireEvent.click(dialog.getByRole('button', { name: 'Add row' }));
		expect(table()?.content).toHaveLength(3);
		await fireEvent.click(dialog.getByRole('button', { name: 'Add column' }));
		expect(table()?.content?.[0].content).toHaveLength(3);
		await fireEvent.click(dialog.getByRole('button', { name: 'Done' }));
		expect(toolbar.getAllByRole('button')).toHaveLength(count);
	});
	it('keeps a formatted button label as one link', () => {
		const link = { type: 'link', attrs: { href: '/feedback', appearance: 'button' } };
		const view = render(RichTextRenderer, {
			value: {
				schemaVersion: 1,
				doc: {
					type: 'doc',
					content: [
						{
							type: 'paragraph',
							content: [
								{ type: 'text', text: 'Give ', marks: [link] },
								{ type: 'text', text: 'feedback', marks: [link, { type: 'bold' }] }
							]
						}
					]
				}
			}
		});
		expect(view.getAllByRole('link')).toHaveLength(1);
		expect(
			view.getByRole('link', { name: 'Give feedback' }).querySelector('strong')
		).toHaveTextContent('feedback');
	});
	it('inserts a labeled button-style link and keeps it an anchor in the renderer', async () => {
		const onChange = vi.fn();
		const view = render(RichTextEditor, { value: emptyDocument(), onChange });
		await fireEvent.click(view.getByRole('button', { name: 'Edit link' }));
		await fireEvent.input(view.getByRole('textbox', { name: 'URL' }), {
			target: { value: 'https://example.com/feedback' }
		});
		await fireEvent.input(view.getByRole('textbox', { name: 'Link text' }), {
			target: { value: 'Give feedback' }
		});
		await fireEvent.change(view.getByRole('combobox', { name: 'Link appearance' }), {
			target: { value: 'button' }
		});
		await fireEvent.click(view.getByRole('button', { name: 'Apply' }));
		await waitFor(() => expect(onChange).toHaveBeenCalled());
		const value = onChange.mock.calls.at(-1)![0] as RichTextDocument;
		expect(JSON.stringify(value)).toContain('"appearance":"button"');
		view.unmount();
		const reader = render(RichTextRenderer, { value });
		expect(reader.getByRole('link', { name: 'Give feedback' })).toHaveAttribute(
			'href',
			'https://example.com/feedback'
		);
		expect(reader.getByRole('link', { name: 'Give feedback' })).toHaveClass('not-prose');
	});
	it('edits the full existing link label without duplicating it', async () => {
		const onChange = vi.fn();
		const view = render(RichTextEditor, {
			value: {
				schemaVersion: 1,
				doc: {
					type: 'doc',
					content: [
						{
							type: 'paragraph',
							content: [
								{
									type: 'text',
									text: 'Old label',
									marks: [{ type: 'link', attrs: { href: 'https://example.com' } }]
								}
							]
						}
					]
				}
			},
			onChange
		});
		await fireEvent.click(view.getByRole('button', { name: 'Edit link' }));
		expect(view.getByRole('textbox', { name: 'Link text' })).toHaveValue('Old label');
		await fireEvent.input(view.getByRole('textbox', { name: 'Link text' }), {
			target: { value: 'New label' }
		});
		await fireEvent.click(view.getByRole('button', { name: 'Apply' }));
		await waitFor(() => expect(onChange).toHaveBeenCalled());
		expect(JSON.stringify(onChange.mock.calls.at(-1)![0])).toContain('New label');
		expect(JSON.stringify(onChange.mock.calls.at(-1)![0])).not.toContain('Old label');
	});
	it('uploads and reuses a post image while storing its public reference', async () => {
		const image = {
			id: 'image',
			name: 'Photo.png',
			url: '/posts/images/post/image',
			previewUrl: '/post/manage/post/images/image'
		};
		const upload = vi.fn(async () => image),
			onChange = vi.fn();
		const view = render(RichTextEditor, {
			value: emptyDocument(),
			onUploadImage: upload,
			onChange
		});
		await fireEvent.click(view.getByRole('button', { name: 'Insert or edit image' }));
		await fireEvent.click(view.getByRole('tab', { name: 'Upload' }));
		const file = new File(['image'], 'Photo.png', { type: 'image/png' });
		await fireEvent.change(view.getByLabelText('Image file'), { target: { files: [file] } });
		await fireEvent.click(view.getByRole('button', { name: 'Upload image' }));
		await waitFor(() =>
			expect(view.getByRole('button', { name: 'Photo.png' })).toBeInTheDocument()
		);
		expect(upload).toHaveBeenCalledWith(file);
		await fireEvent.click(view.getByRole('button', { name: 'Photo.png' }));
		await fireEvent.click(view.getByRole('button', { name: 'Apply' }));
		await waitFor(() => expect(onChange).toHaveBeenCalled());
		expect(JSON.stringify(onChange.mock.calls.at(-1)![0])).toContain(image.url);
		expect(
			view.getByRole('textbox', { name: 'Rich text content' }).querySelector('img')
		).toHaveAttribute('src', image.previewUrl);
	});
	it('uses Tiptap to insert an image from the themed settings dialog', async () => {
		const onChange = vi.fn();
		const view = render(RichTextEditor, { value: emptyDocument(), onChange });
		await fireEvent.click(view.getByRole('button', { name: 'Insert or edit image' }));
		await fireEvent.input(view.getByRole('textbox', { name: 'URL' }), {
			target: { value: 'https://example.com/photo.png' }
		});
		await fireEvent.click(view.getByRole('button', { name: 'Apply' }));
		await waitFor(() => expect(onChange).toHaveBeenCalled());
		expect(JSON.stringify(onChange.mock.calls.at(-1)?.[0])).toContain(
			'https://example.com/photo.png'
		);
	});
	it('updates from an external document without losing formatting and respects disabled state', async () => {
		const view = render(RichTextEditor, { value: emptyDocument(), disabled: true });
		expect(view.getByRole('button', { name: 'Bold' })).toBeDisabled();
		await view.rerender({
			value: {
				schemaVersion: 1,
				doc: {
					type: 'doc',
					content: [
						{
							type: 'paragraph',
							content: [{ type: 'text', text: 'Saved text', marks: [{ type: 'bold' }] }]
						}
					]
				}
			},
			disabled: false
		});
		await waitFor(() =>
			expect(view.getByRole('textbox', { name: 'Rich text content' })).toHaveTextContent(
				'Saved text'
			)
		);
		expect(
			view.getByRole('textbox', { name: 'Rich text content' }).querySelector('strong')
		).toHaveTextContent('Saved text');
	});
	it('renders stored rich text without interpreting text as HTML', () => {
		const value: RichTextDocument = {
			schemaVersion: 1,
			doc: {
				type: 'doc',
				content: [
					{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'News' }] },
					{
						type: 'paragraph',
						content: [{ type: 'text', text: '<script>unsafe</script>', marks: [{ type: 'bold' }] }]
					}
				]
			}
		};
		const view = render(RichTextRenderer, { value });
		expect(view.getByRole('heading', { name: 'News' })).toBeInTheDocument();
		expect(view.getByText('<script>unsafe</script>')).toBeInTheDocument();
		expect(view.container.querySelector('script')).toBeNull();
	});
});
