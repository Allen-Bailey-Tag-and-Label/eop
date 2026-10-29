import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/svelte';
import SlideEditor from './SlideEditor.svelte';
import { blankSlide, newElement } from './types';

vi.mock('$app/forms', () => ({
	enhance: vi.fn(() => ({ destroy: vi.fn() })),
	deserialize: (value: string) => JSON.parse(value)
}));
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
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('slide authoring', () => {
	it('edits and saves vertical text alignment for slide and repeater template text', async () => {
		vi.useFakeTimers();
		const view = render(SlideEditor, {
			data: {
				slide: { id: '', title: '', slug: '', version: 0, publishedAt: null, draft: blankSlide() },
				assets: []
			}
		});
		const definition = () =>
			JSON.parse(
				(view.container.querySelector('input[name="definition"]') as HTMLInputElement).value
			);
		await fireEvent.click(view.getByRole('button', { name: 'Add text' }));
		expect(view.getByRole('button', { name: 'Align text top' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await fireEvent.click(view.getByRole('button', { name: 'Align text middle' }));
		expect(view.getByRole('button', { name: 'Align text middle' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		expect(definition().elements[0].verticalAlign).toBe('middle');
		await fireEvent.click(view.getByRole('button', { name: 'Add repeater' }));
		await fireEvent.click(view.getByRole('button', { name: 'Edit item template' }));
		await fireEvent.click(view.getByRole('button', { name: 'Align text bottom' }));
		expect(definition().elements[1].repeater.template.elements[1].verticalAlign).toBe('bottom');
		expect(definition().elements[0].verticalAlign).toBe('middle');
	});
	it('drags layers in both directions, retains selection and content, and ignores cancelled or external drops', async () => {
		vi.stubGlobal(
			'DragEvent',
			class extends MouseEvent {
				dataTransfer: DataTransfer | null;
				constructor(type: string, init: DragEventInit = {}) {
					super(type, init);
					this.dataTransfer = init.dataTransfer ?? null;
				}
			}
		);
		const draft = blankSlide();
		draft.elements = ['First', 'Second', 'Third'].map((name) => ({
			...newElement('text', name),
			text: name
		}));
		draft.elements[0].keyframes = [
			{ ...draft.elements[0], atMs: 1000, easing: 'linear', rotation: 45 }
		];
		const view = render(SlideEditor, {
			data: {
				slide: { id: '', title: '', slug: '', version: 0, publishedAt: null, draft },
				assets: []
			}
		});
		const definition = () =>
			JSON.parse(
				(view.container.querySelector('input[name="definition"]') as HTMLInputElement).value
			);
		const order = () => definition().elements.map((element: { id: string }) => element.id);
		const original = definition().elements[0];
		await fireEvent.click(view.getByRole('button', { name: 'Show layers' }));
		const first = view.getByRole('button', { name: 'Layer 1: text: First' });
		const third = view.getByRole('button', { name: 'Layer 3: text: Third' });
		const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' };
		await fireEvent.dragStart(first, { dataTransfer });
		await fireEvent.dragOver(third, { clientY: 1, dataTransfer });
		expect(third).toHaveClass('border-b-sky-500');
		await fireEvent.drop(third, { clientY: 1, dataTransfer });
		expect(order()).toEqual(['Second', 'Third', 'First']);
		expect(view.getByRole('button', { name: 'Layer 3: text: First' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		expect(definition().elements[2]).toEqual(original);
		await fireEvent.dragStart(first, { dataTransfer });
		await fireEvent.drop(view.getByRole('button', { name: 'Layer 1: text: Second' }), {
			clientY: -1
		});
		expect(order()).toEqual(['First', 'Second', 'Third']);
		await fireEvent.dragStart(first, { dataTransfer });
		await fireEvent.dragEnd(first);
		await fireEvent.drop(third, { clientY: 1 });
		expect(order()).toEqual(['First', 'Second', 'Third']);
		await fireEvent.keyDown(first, { key: 'ArrowUp', altKey: true });
		expect(order()).toEqual(['First', 'Second', 'Third']);
		await fireEvent.keyDown(first, { key: 'ArrowDown', altKey: true });
		expect(order()).toEqual(['Second', 'First', 'Third']);
	});
	it('reorders repeater template layers without changing the slide stack', async () => {
		vi.useFakeTimers();
		const view = render(SlideEditor, {
			data: {
				slide: { id: '', title: '', slug: '', version: 0, publishedAt: null, draft: blankSlide() },
				assets: []
			}
		});
		const definition = () =>
			JSON.parse(
				(view.container.querySelector('input[name="definition"]') as HTMLInputElement).value
			);
		await fireEvent.click(view.getByRole('button', { name: 'Add text' }));
		await fireEvent.click(view.getByRole('button', { name: 'Add repeater' }));
		const before = definition();
		await fireEvent.click(view.getByRole('button', { name: 'Edit item template' }));
		await fireEvent.click(view.getByRole('button', { name: 'Show layers' }));
		const layers = view.getAllByRole('button', { name: /^Layer \d+:/ });
		await fireEvent.keyDown(layers[0], { key: 'ArrowDown', altKey: true });
		const after = definition();
		expect(after.elements.map((element: { id: string }) => element.id)).toEqual(
			before.elements.map((element: { id: string }) => element.id)
		);
		const children = before.elements[1].repeater.template.elements;
		expect(after.elements[1].repeater.template.elements).toEqual([
			children[1],
			children[0],
			...children.slice(2)
		]);
	});
	it('adds a generic data list, previews server data, and saves only its source configuration', async () => {
		vi.useFakeTimers();
		const fetch = vi.fn<typeof globalThis.fetch>(
			async () =>
				new Response(
					JSON.stringify({
						type: 'success',
						data: {
							slideData: {
								calendar: {
									state: 'ready',
									items: [
										{
											id: 'holiday',
											label: 'Thanksgiving',
											detail: 'Nov 26, 2026',
											fields: { name: 'Thanksgiving' }
										}
									],
									message: ''
								}
							}
						}
					})
				)
		);
		vi.stubGlobal('fetch', fetch);
		const view = render(SlideEditor, {
			data: {
				slide: { id: '', title: '', slug: '', version: 0, publishedAt: null, draft: blankSlide() },
				assets: [{ id: 'a'.repeat(24), name: 'Test SVG', contentType: 'image/svg+xml' }]
			}
		});
		await fireEvent.click(view.getByRole('button', { name: 'Add repeater' }));
		expect(view.queryByRole('button', { name: 'Add upcoming holidays' })).not.toBeInTheDocument();
		await fireEvent.change(view.getByRole('combobox', { name: 'Data model' }), {
			target: { value: 'Holiday' }
		});
		await fireEvent.input(view.getByRole('textbox', { name: 'Data select' }), {
			target: { value: 'name date' }
		});
		await fireEvent.input(view.getByRole('textbox', { name: 'Data filter' }), {
			target: { value: '{"date":{"$gte":{"$date":"today"}}}' }
		});

		const definition = () =>
			JSON.parse(
				(view.container.querySelector('input[name="definition"]') as HTMLInputElement).value
			);
		const id = definition().elements[0].id;
		fetch.mockImplementation(
			async () =>
				new Response(
					JSON.stringify({
						type: 'success',
						data: {
							slideData: {
								[id]: {
									state: 'ready',
									items: [
										{
											id: 'holiday',
											label: 'Thanksgiving',
											detail: 'Nov 26, 2026',
											fields: { name: 'Thanksgiving' }
										}
									],
									message: ''
								}
							}
						}
					})
				)
		);
		await vi.advanceTimersByTimeAsync(400);
		expect(fetch.mock.calls[0][1]?.headers).toEqual({
			accept: 'application/json',
			'x-sveltekit-action': 'true'
		});
		expect(view.getByText('Thanksgiving')).toBeInTheDocument();
		expect(definition().elements[0].dataSource).toMatchObject({
			model: 'Holiday',
			filter: '{"date":{"$gte":{"$date":"today"}}}',
			limit: 5
		});
		expect(JSON.stringify(definition())).not.toContain('Thanksgiving');
		await fireEvent.input(view.getByRole('spinbutton', { name: 'Columns (0 = automatic)' }), {
			target: { value: '3' }
		});
		await fireEvent.click(view.getByRole('button', { name: 'Edit item template' }));
		expect(view.getByText('Editing repeater item template')).toBeInTheDocument();
		expect(view.queryByRole('button', { name: 'Add repeater' })).not.toBeInTheDocument();
		await fireEvent.change(view.getByRole('combobox', { name: 'Text data binding' }), {
			target: { value: 'row.name' }
		});
		await fireEvent.input(view.getByRole('spinbutton', { name: 'Font size' }), {
			target: { value: '52' }
		});
		await fireEvent.click(view.getByRole('button', { name: 'Back to slide' }));
		expect(definition().elements[0].repeater.columns).toBe(3);
		expect(definition().elements[0].repeater.template.elements[1]).toMatchObject({
			fontSize: 52,
			binding: { field: 'row.name', format: 'text' }
		});
		expect(fetch).toHaveBeenCalledTimes(1);

		await fireEvent.input(view.getByRole('spinbutton', { name: 'Data limit' }), {
			target: { value: '10' }
		});
		await vi.advanceTimersByTimeAsync(400);
		expect(fetch).toHaveBeenCalledTimes(2);
		const body = fetch.mock.calls[1][1]?.body as FormData;
		expect(JSON.parse(body.get('definition') as string).elements[0].dataSource.limit).toBe(10);
		await fireEvent.input(view.getByRole('slider', { name: 'Preview timeline' }), {
			target: { value: '1000' }
		});
		await vi.advanceTimersByTimeAsync(400);
		expect(fetch).toHaveBeenCalledTimes(2);
		await fireEvent.click(view.getByRole('button', { name: 'Add image / graphic' }));
		expect(definition().elements[1]).toMatchObject({ type: 'svg', assetId: 'a'.repeat(24) });
		expect(view.container.querySelector('img')?.getAttribute('src')).toBe(
			`/admin/monitors/slides/assets/${'a'.repeat(24)}`
		);
		await vi.advanceTimersByTimeAsync(400);
		expect(fetch).toHaveBeenCalledTimes(2);
		expect(view.getByText('Thanksgiving')).toBeInTheDocument();
	});
	it('asks for an uploaded graphic instead of inserting an invalid empty element', async () => {
		const view = render(SlideEditor, {
			data: {
				slide: { id: '', title: '', slug: '', version: 0, publishedAt: null, draft: blankSlide() },
				assets: []
			}
		});
		await fireEvent.click(view.getByRole('button', { name: 'Add image / graphic' }));
		expect(view.getByRole('dialog')).toHaveTextContent('Upload an image or SVG asset first');
		const definition = JSON.parse(
			(view.container.querySelector('input[name="definition"]') as HTMLInputElement).value
		);
		expect(definition.elements).toHaveLength(0);
	});
	it('uses one tool and asset selector for raster images and SVGs, including item templates', async () => {
		const raster = 'b'.repeat(24);
		const svg = 'a'.repeat(24);
		const view = render(SlideEditor, {
			data: {
				slide: { id: '', title: '', slug: '', version: 0, publishedAt: null, draft: blankSlide() },
				assets: [
					{ id: raster, name: 'Photo', contentType: 'image/png' },
					{ id: svg, name: 'Logo', contentType: 'image/svg+xml' }
				]
			}
		});
		const definition = () =>
			JSON.parse(
				(view.container.querySelector('input[name="definition"]') as HTMLInputElement).value
			);
		expect(view.queryByRole('button', { name: 'Add svg' })).not.toBeInTheDocument();
		await fireEvent.click(view.getByRole('button', { name: 'Add image / graphic' }));
		expect(definition().elements[0]).toMatchObject({ type: 'image', assetId: raster });
		await fireEvent.change(view.getByRole('combobox', { name: 'Graphic asset' }), {
			target: { value: svg }
		});
		expect(definition().elements[0]).toMatchObject({ type: 'svg', assetId: svg });
		expect(view.container.querySelector('img')?.getAttribute('src')).toBe(
			`/admin/monitors/slides/assets/${svg}`
		);
		await fireEvent.change(view.getByRole('combobox', { name: 'Graphic asset' }), {
			target: { value: raster }
		});
		expect(definition().elements[0]).toMatchObject({ type: 'image', assetId: raster });
		await fireEvent.click(view.getByRole('button', { name: 'Add repeater' }));
		await fireEvent.click(view.getByRole('button', { name: 'Edit item template' }));
		await fireEvent.click(view.getByRole('button', { name: 'Add image / graphic' }));
		await fireEvent.change(view.getByRole('combobox', { name: 'Graphic asset' }), {
			target: { value: svg }
		});
		await fireEvent.click(view.getByRole('button', { name: 'Back to slide' }));
		expect(definition().elements[1].repeater.template.elements.at(-1)).toMatchObject({
			type: 'svg',
			assetId: svg
		});
	});
	it('defaults to slide assets and requires explicitly choosing the shared library', async () => {
		const own = 'b'.repeat(24),
			shared = 'c'.repeat(24),
			scope = 'a'.repeat(24);
		const view = render(SlideEditor, {
			data: {
				slide: { id: '', title: '', slug: '', version: 0, publishedAt: null, draft: blankSlide() },
				assetScopeId: scope,
				assets: [
					{
						id: own,
						name: 'Private photo',
						contentType: 'image/png',
						scope: 'slide',
						slideId: scope
					}
				],
				sharedAssets: [
					{ id: shared, name: 'Shared logo', contentType: 'image/svg+xml', scope: 'shared' }
				]
			}
		});
		const definition = () =>
			JSON.parse(
				(view.container.querySelector('input[name="definition"]') as HTMLInputElement).value
			);
		await fireEvent.click(view.getByRole('button', { name: 'Add image / graphic' }));
		expect(definition().elements[0].assetId).toBe(own);
		expect(view.getByRole('combobox', { name: 'Graphic asset' })).not.toHaveTextContent(
			'Shared logo'
		);
		await fireEvent.click(view.getByRole('button', { name: 'Shared library' }));
		expect(view.getByRole('combobox', { name: 'Graphic asset' })).toHaveTextContent('Shared logo');
		await fireEvent.change(view.getByRole('combobox', { name: 'Graphic asset' }), {
			target: { value: shared }
		});
		await fireEvent.click(view.getByRole('button', { name: 'This slide' }));
		expect(view.getByRole('combobox', { name: 'Graphic asset' })).toHaveTextContent('Shared logo');
		expect(
			(view.container.querySelector('input[name="assetScopeId"]') as HTMLInputElement).value
		).toBe(scope);
		await fireEvent.click(view.getByRole('button', { name: 'Upload asset' }));
		expect(view.getByRole('dialog').querySelector('form')?.getAttribute('action')).toBe(
			`?/upload&assetScope=${scope}`
		);
	});
	it('shows action validation errors in the repeater instead of a generic retry message', async () => {
		vi.useFakeTimers();
		vi.stubGlobal(
			'fetch',
			vi.fn(
				async () =>
					new Response(
						JSON.stringify({
							type: 'failure',
							status: 400,
							data: { error: 'Select fields must be space separated.' }
						}),
						{ status: 400 }
					)
			)
		);
		const view = render(SlideEditor, {
			data: {
				slide: { id: '', title: '', slug: '', version: 0, publishedAt: null, draft: blankSlide() },
				assets: []
			}
		});
		await fireEvent.click(view.getByRole('button', { name: 'Add repeater' }));
		await vi.advanceTimersByTimeAsync(400);
		expect(view.getByText('Select fields must be space separated.')).toBeInTheDocument();
	});
	it('saves rotation, borders, text backgrounds and corner radius through properties and templates', async () => {
		const view = render(SlideEditor, {
			data: {
				slide: { id: '', title: '', slug: '', version: 0, publishedAt: null, draft: blankSlide() },
				assets: [{ id: 'a'.repeat(24), name: 'Photo', contentType: 'image/png' }]
			}
		});
		const definition = () =>
			JSON.parse(
				(view.container.querySelector('input[name="definition"]') as HTMLInputElement).value
			);
		await fireEvent.click(view.getByRole('button', { name: 'Add text' }));
		await fireEvent.input(view.getByRole('spinbutton', { name: 'Rotation (degrees)' }), {
			target: { value: '45' }
		});
		await fireEvent.click(view.getByRole('button', { name: 'Rotate right 90 degrees' }));
		await fireEvent.click(view.getByText('Stroke', { selector: 'summary' }));
		await fireEvent.input(view.getByRole('spinbutton', { name: 'Border width' }), {
			target: { value: '4' }
		});
		await fireEvent.change(view.getByRole('combobox', { name: 'Border style' }), {
			target: { value: 'dashed' }
		});
		await fireEvent.change(view.getByRole('combobox', { name: 'Text background' }), {
			target: { value: 'color' }
		});
		await fireEvent.input(view.getByRole('spinbutton', { name: 'Corner radius' }), {
			target: { value: '24' }
		});
		await fireEvent.input(view.getByRole('spinbutton', { name: 'Text padding' }), {
			target: { value: '12' }
		});
		expect(definition().elements[0]).toMatchObject({
			rotation: 135,
			borderWidth: 4,
			borderStyle: 'dashed',
			borderRadius: 24,
			padding: 12,
			backgroundColor: { light: '#ffffff', dark: '#111827' }
		});
		await fireEvent.click(view.getByRole('button', { name: 'Reset object rotation' }));
		expect(definition().elements[0].rotation).toBe(0);
		await fireEvent.click(view.getByRole('button', { name: 'Add image / graphic' }));
		await fireEvent.input(view.getByRole('spinbutton', { name: 'Corner radius' }), {
			target: { value: '30' }
		});
		expect(definition().elements[1].borderRadius).toBe(30);
		await fireEvent.click(view.getByRole('button', { name: 'Add repeater' }));
		await fireEvent.click(view.getByRole('button', { name: 'Edit item template' }));
		await fireEvent.click(view.getByText('Stroke', { selector: 'summary' }));
		await fireEvent.input(view.getByRole('spinbutton', { name: 'Border width' }), {
			target: { value: '2' }
		});
		await fireEvent.input(view.getByRole('spinbutton', { name: 'Corner radius' }), {
			target: { value: '10' }
		});
		await fireEvent.click(view.getByRole('button', { name: 'Back to slide' }));
		expect(definition().elements[2].repeater.template.elements[1]).toMatchObject({
			borderWidth: 2,
			borderRadius: 10
		});
	});
	it('groups properties in collapsible Details and preserves compact percent, hex, and icon controls', async () => {
		const view = render(SlideEditor, {
			data: {
				slide: { id: '', title: '', slug: '', version: 0, publishedAt: null, draft: blankSlide() },
				assets: []
			}
		});
		const definition = () =>
			JSON.parse(
				(view.container.querySelector('input[name="definition"]') as HTMLInputElement).value
			);
		await fireEvent.click(view.getByRole('button', { name: 'Add text' }));
		const stroke = view.getByText('Stroke', { selector: 'summary' }).closest('details')!;
		expect(stroke.open).toBe(false);
		await fireEvent.click(view.getByText('Stroke', { selector: 'summary' }));
		expect(stroke.open).toBe(true);
		await fireEvent.input(view.getByRole('spinbutton', { name: 'Border width' }), {
			target: { value: '3' }
		});
		await fireEvent.click(view.getByText('Stroke', { selector: 'summary' }));
		expect(stroke.open).toBe(false);
		expect(definition().elements[0].borderWidth).toBe(3);
		await fireEvent.input(view.getByRole('spinbutton', { name: 'scale' }), {
			target: { value: '125' }
		});
		await fireEvent.input(view.getByRole('spinbutton', { name: 'opacity' }), {
			target: { value: '50' }
		});
		await fireEvent.click(view.getByRole('button', { name: 'Align text right' }));
		await fireEvent.input(view.getByRole('textbox', { name: 'Element color in light mode hex' }), {
			target: { value: '112233' }
		});
		expect(definition().elements[0]).toMatchObject({
			scale: 1.25,
			opacity: 0.5,
			align: 'right',
			color: { light: '#112233' }
		});
		const hex = view.getByRole('textbox', { name: 'Element color in light mode hex' });
		await fireEvent.input(hex, { target: { value: 'INVALID' } });
		await fireEvent.blur(hex);
		expect(hex).toHaveValue('112233');
		const fill = view.getByText('Fill', { selector: 'summary' }).closest('details')!;
		await fireEvent.click(view.getByText('Fill', { selector: 'summary' }));
		expect(fill.open).toBe(false);
		await fireEvent.click(view.getByRole('button', { name: 'Edit element color' }));
		expect(fill.open).toBe(true);
	});
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
		await fireEvent.click(
			Array.from(container.querySelectorAll('summary')).find((summary) =>
				summary.textContent?.includes('Responsive anchoring')
			)!
		);
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
