import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import SlideEditor from './SlideEditor.svelte';
import { blankSlide, newElement } from './types';

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
	it('saves anchor choices with the slide and previews alternate screen shapes without changing reference dimensions', async () => {
		const { container, getByRole, getByText } = render(SlideEditor, {
			data: {
				slide: { id: '', title: '', slug: '', version: 0, publishedAt: null, draft: blankSlide() },
				assets: []
			}
		});
		await fireEvent.click(getByRole('button', { name: 'Add text' }));
		await fireEvent.change(getByRole('combobox', { name: 'Horizontal anchoring' }), {
			target: { value: 'right' }
		});
		await fireEvent.change(getByRole('combobox', { name: 'Vertical anchoring' }), {
			target: { value: 'bottom' }
		});
		await fireEvent.change(getByRole('combobox', { name: 'Preview aspect ratio' }), {
			target: { value: 'portrait' }
		});
		const definition = JSON.parse(
			(container.querySelector('input[name="definition"]') as HTMLInputElement).value
		);
		expect(definition.elements[0]).toMatchObject({
			horizontalAnchor: 'right',
			verticalAnchor: 'bottom'
		});
		expect(definition).toMatchObject({ width: 1920, height: 1080 });
		expect(getByText('1080 × 1920 · 1 elements')).toBeInTheDocument();
	});
	it('keeps document settings in a dialog and submits them through the top save form', async () => {
		const { container, getByRole, queryByRole } = render(SlideEditor, {
			data: {
				slide: { id: '', title: '', slug: '', version: 0, publishedAt: null, draft: blankSlide() },
				assets: []
			}
		});
		expect(getByRole('toolbar', { name: 'Document actions' })).toBeInTheDocument();
		expect(getByRole('region', { name: 'Animation timeline controls' })).toBeInTheDocument();
		expect(queryByRole('textbox', { name: 'Slide title' })).not.toBeInTheDocument();
		await fireEvent.click(getByRole('button', { name: 'Settings' }));
		await fireEvent.input(getByRole('textbox', { name: 'Slide title' }), {
			target: { value: 'Safety first' }
		});
		await fireEvent.input(getByRole('textbox', { name: 'Slide slug' }), {
			target: { value: 'safety-first' }
		});
		await fireEvent.click(getByRole('button', { name: 'Done' }));
		expect(container.querySelector('input[name="title"]')).toHaveValue('Safety first');
		expect(container.querySelector('input[name="slug"]')).toHaveValue('safety-first');
	});
	it('nudges the entire animation and resizes from the canvas using keyboard controls', async () => {
		const element = newElement('text', 'headline');
		element.keyframes = [{ ...element, x: 200, atMs: 1000, easing: 'linear' }];
		const { container, getByRole } = render(SlideEditor, {
			data: {
				slide: {
					id: '',
					title: '',
					slug: '',
					version: 0,
					publishedAt: null,
					draft: { ...blankSlide(), elements: [element] }
				},
				assets: []
			}
		});
		await fireEvent.click(getByRole('button', { name: 'Select element 1: text' }));
		await fireEvent.keyDown(getByRole('button', { name: 'Select element 1: text' }), {
			key: 'ArrowRight',
			shiftKey: true
		});
		let saved = JSON.parse(
			(container.querySelector('input[name="definition"]') as HTMLInputElement).value
		);
		expect(saved.elements[0].x).toBe(170);
		expect(saved.elements[0].keyframes[0].x).toBe(210);
		await fireEvent.click(getByRole('button', { name: 'Resize tool' }));
		await fireEvent.keyDown(getByRole('button', { name: 'Resize selected element' }), {
			key: 'ArrowRight',
			shiftKey: true
		});
		saved = JSON.parse(
			(container.querySelector('input[name="definition"]') as HTMLInputElement).value
		);
		expect(saved.elements[0].width).toBe(810);
	});
	it('builds an animated text definition and exports the same data used by the save form', async () => {
		const { container, getByRole } = render(SlideEditor, {
			data: {
				slide: { id: '', title: '', slug: '', version: 0, publishedAt: null, draft: blankSlide() },
				assets: []
			}
		});
		await fireEvent.click(getByRole('button', { name: 'Add text' }));
		await fireEvent.click(getByRole('button', { name: 'animation' }));
		await fireEvent.click(getByRole('button', { name: 'Fade in' }));
		await fireEvent.click(getByRole('button', { name: 'Export' }));
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
		await fireEvent.click(getByRole('button', { name: 'Close dialog' }));
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
		await fireEvent.click(getByRole('button', { name: 'Import' }));
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
