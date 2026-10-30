import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, fireEvent, waitFor } from '@testing-library/svelte';
import RichTextEditor from './RichTextEditor.svelte';
import RichTextRenderer from '../RichTextRenderer/RichTextRenderer.svelte';
import { emptyDocument, type RichTextDocument } from '$lib/rich-text/document';
vi.mock('sveltewind/transitions', () => ({ subtleReveal: () => ({ duration: 0 }) }));
beforeEach(() => {
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
});
describe('shared rich text editor', () => {
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
		await fireEvent.click(view.getByRole('button', { name: 'Upload' }));
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
