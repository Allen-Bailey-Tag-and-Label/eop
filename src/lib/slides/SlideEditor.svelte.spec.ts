import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/svelte';
import SlideEditor from './SlideEditor.svelte';
import { blankSlide, newElement } from './types';

vi.mock('$app/forms', () => ({ enhance: vi.fn(() => ({ destroy: vi.fn() })) }));
vi.mock('sveltewind/transitions', () => ({ subtleReveal: () => ({ duration: 0 }) }));
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
	it('edits light/dark colors, previews each mode, and can lock the chosen color as fixed', async () => {
		const view = render(SlideEditor, {
			data: {
				slide: { id: '', title: '', slug: '', version: 0, publishedAt: null, draft: blankSlide() },
				assets: []
			}
		});
		await fireEvent.click(view.getByRole('button', { name: 'Add text' }));
		expect(view.getByRole('combobox', { name: 'Element color mode' })).toHaveValue('themed');
		await fireEvent.input(view.getByLabelText('Element color in light mode'), {
			target: { value: '#123456' }
		});
		await fireEvent.input(view.getByLabelText('Element color in dark mode'), {
			target: { value: '#abcdef' }
		});
		const canvas = within(view.getByRole('img', { name: 'Slide preview' }));
		expect(canvas.getByText('Your text here')).toHaveStyle({ color: '#abcdef' });
		await fireEvent.change(view.getByRole('combobox', { name: 'Preview color mode' }), {
			target: { value: 'light' }
		});
		expect(canvas.getByText('Your text here')).toHaveStyle({ color: '#123456' });
		expect(view.getByRole('img', { name: 'Slide preview' }).parentElement).toHaveStyle({
			background: '#ffffff'
		});
		const saved = () =>
			JSON.parse(
				(view.container.querySelector('input[name="definition"]') as HTMLInputElement).value
			);
		expect(saved().elements[0].color).toEqual({ light: '#123456', dark: '#abcdef' });
		await fireEvent.change(view.getByRole('combobox', { name: 'Element color mode' }), {
			target: { value: 'fixed' }
		});
		expect(saved().elements[0].color).toBe('#123456');
		await fireEvent.change(view.getByRole('combobox', { name: 'Preview color mode' }), {
			target: { value: 'dark' }
		});
		expect(canvas.getByText('Your text here')).toHaveStyle({ color: '#123456' });
		await fireEvent.change(view.getByRole('combobox', { name: 'Element color mode' }), {
			target: { value: 'themed' }
		});
		expect(saved().elements[0].color).toEqual({ light: '#123456', dark: '#123456' });
	});
	it('saves transparent backgrounds without coercing them through the color picker and restores the solid color', async () => {
		const view = render(SlideEditor, {
			data: {
				slide: {
					id: '',
					title: '',
					slug: '',
					version: 0,
					publishedAt: null,
					draft: { ...blankSlide(), background: '#123456' }
				},
				assets: []
			}
		});
		await fireEvent.click(view.getByRole('button', { name: 'Settings' }));
		const background = view.getByRole('combobox', { name: 'Slide background type' });
		await fireEvent.change(background, { target: { value: 'transparent' } });
		expect(view.getByLabelText('Slide background')).toBeDisabled();
		const definition = () =>
			JSON.parse(
				(view.container.querySelector('input[name="definition"]') as HTMLInputElement).value
			);
		expect(definition().background).toBe('transparent');
		expect(view.getByRole('img', { name: 'Slide preview' })).toHaveStyle({
			background: 'transparent'
		});
		await fireEvent.change(background, { target: { value: 'solid' } });
		expect(definition().background).toBe('#123456');
		expect(view.getByLabelText('Slide background')).toBeEnabled();
	});
	it('saves independent whole-slide transition settings and previews them on the timeline', async () => {
		const view = render(SlideEditor, {
			data: {
				slide: { id: '', title: '', slug: '', version: 0, publishedAt: null, draft: blankSlide() },
				assets: []
			}
		});
		expect(view.getByRole('slider', { name: 'Preview timeline' })).toHaveAttribute('max', '14000');
		await fireEvent.click(view.getByRole('button', { name: 'Settings' }));
		expect(
			view.getByRole('spinbutton', { name: 'Slide transition in duration in milliseconds' })
		).toHaveValue(2000);
		await fireEvent.input(
			view.getByRole('spinbutton', { name: 'Slide transition in duration in milliseconds' }),
			{ target: { value: '4000' } }
		);
		expect(view.container.querySelector('input[aria-label="Preview timeline"]')).toHaveAttribute(
			'max',
			'16000'
		);
		await fireEvent.change(view.getByRole('combobox', { name: 'Slide transition out' }), {
			target: { value: 'none' }
		});
		expect(
			view.getByRole('spinbutton', { name: 'Slide transition out duration in milliseconds' })
		).toBeDisabled();
		await fireEvent.click(view.getByRole('button', { name: 'Done' }));
		expect(view.getByRole('slider', { name: 'Preview timeline' })).toHaveAttribute('max', '14000');
		const definition = JSON.parse(
			(view.container.querySelector('input[name="definition"]') as HTMLInputElement).value
		);
		expect(definition.transitionIn).toEqual({ type: 'fade', durationMs: 4000 });
		expect(definition.transitionOut).toEqual({ type: 'none', durationMs: 2000 });
		const canvas = view.getByRole('img', { name: 'Slide preview' });
		expect(canvas).toHaveStyle({ opacity: '1' });
		await fireEvent.input(view.getByRole('slider', { name: 'Preview timeline' }), {
			target: { value: '1000' }
		});
		expect(canvas).toHaveStyle({ opacity: '0.25' });
	});
	it('requires confirmation to unpublish and lists affected playlists', async () => {
		const view = render(SlideEditor, {
			data: {
				slide: {
					id: 'a'.repeat(24),
					title: 'Welcome',
					slug: 'welcome',
					version: 2,
					publishedAt: new Date().toISOString(),
					draft: blankSlide()
				},
				assets: [],
				references: [{ slug: 'break-room', title: 'Break room', draft: false, published: true }]
			}
		});
		await fireEvent.click(view.getByRole('button', { name: 'Settings' }));
		expect(view.baseElement.querySelector('form[action="?/unpublish"]')).toBeNull();
		await fireEvent.click(view.getByRole('button', { name: 'Unpublish slide' }));
		const confirmation = within(view.getByRole('dialog', { name: 'Unpublish slide?' }));
		expect(confirmation.getByRole('link', { name: 'Break room' })).toHaveAttribute(
			'href',
			'/admin/monitors/playlists/break-room'
		);
		expect(confirmation.getByRole('button', { name: 'Unpublish' })).toHaveAttribute(
			'type',
			'submit'
		);
		const form = view.baseElement.querySelector('form[action="?/unpublish"]')!;
		expect(form.querySelector('input[name="version"]')).toHaveValue('2');
		await fireEvent.click(confirmation.getByRole('button', { name: 'Cancel' }));
		expect(view.getByRole('dialog', { name: 'Slide settings' })).toBeInTheDocument();
		expect(view.baseElement.querySelector('form[action="?/unpublish"]')).toBeNull();
	});
	it('blocks deleting a referenced slide and allows confirmation for an unused draft', async () => {
		const data = {
			slide: {
				id: 'a'.repeat(24),
				title: 'Welcome',
				slug: 'welcome',
				version: 2,
				publishedAt: null,
				draft: blankSlide()
			},
			assets: [],
			references: [{ slug: 'break-room', title: 'Break room', draft: true, published: false }]
		};
		const view = render(SlideEditor, { data });
		await fireEvent.click(view.getByRole('button', { name: 'Settings' }));
		expect(view.queryByRole('button', { name: 'Unpublish slide' })).toBeNull();
		await fireEvent.click(view.getByRole('button', { name: 'Delete slide' }));
		expect(view.getByRole('dialog', { name: 'Delete slide?' })).toBeInTheDocument();
		expect(view.getByRole('button', { name: 'Delete permanently' })).toBeDisabled();
		await view.rerender({ data: { ...data, references: [] } });
		expect(view.getByRole('button', { name: 'Delete permanently' })).toBeEnabled();
		expect(view.baseElement.querySelector('form[action="?/delete"]')).not.toBeNull();
	});
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
