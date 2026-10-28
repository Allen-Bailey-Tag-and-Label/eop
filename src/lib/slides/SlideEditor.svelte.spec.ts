import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import SlideEditor from './SlideEditor.svelte';
import { blankSlide } from './types';

vi.mock('$app/forms', () => ({ enhance: vi.fn(() => ({ destroy: vi.fn() })) }));
beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe('slide authoring', () => {
	it('builds an animated text definition and exports the same data used by the save form', async () => {
		const { container, getByRole } = render(SlideEditor, {
			data: {
				slide: { id: '', title: '', slug: '', version: 0, publishedAt: null, draft: blankSlide() },
				assets: []
			}
		});
		await fireEvent.click(getByRole('button', { name: 'Add element' }));
		await fireEvent.click(getByRole('button', { name: 'Fade in' }));
		await fireEvent.click(getByRole('button', { name: 'Export to JSON' }));
		const exported = JSON.parse(
			(getByRole('textbox', { name: 'Slide JSON' }) as HTMLTextAreaElement).value
		);
		expect(exported.elements).toHaveLength(1);
		expect(
			exported.elements[0].keyframes.map((frame: { opacity: number }) => frame.opacity)
		).toEqual([0, 1]);
		expect(
			JSON.parse((container.querySelector('input[name="definition"]') as HTMLInputElement).value)
		).toEqual(exported);
		expect(getByRole('button', { name: 'Publish slide' })).toHaveAttribute('name', 'intent');
		expect(getByRole('button', { name: 'Publish slide' })).toHaveAttribute('value', 'publish');
	});
	it('reports invalid imported content without replacing the current draft', async () => {
		const { container, getByRole } = render(SlideEditor, {
			data: {
				slide: { id: '', title: '', slug: '', version: 0, publishedAt: null, draft: blankSlide() },
				assets: []
			}
		});
		await fireEvent.input(getByRole('textbox', { name: 'Slide JSON' }), {
			target: { value: '{"schemaVersion":999}' }
		});
		await fireEvent.click(getByRole('button', { name: 'Import from JSON' }));
		expect(getByRole('alert')).toHaveTextContent('Unsupported slide version');
		expect(
			JSON.parse((container.querySelector('input[name="definition"]') as HTMLInputElement).value)
		).toEqual(blankSlide());
	});
});
