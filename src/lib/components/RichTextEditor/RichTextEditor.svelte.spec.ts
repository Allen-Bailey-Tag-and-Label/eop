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
