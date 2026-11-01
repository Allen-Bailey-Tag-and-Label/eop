import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import SlideWorkspace from './SlideWorkspace.svelte';
import { blankSlide, newElement } from './types';

const captureMethods = ['setPointerCapture', 'hasPointerCapture', 'releasePointerCapture'] as const;
const originals = captureMethods.map((name) =>
	Object.getOwnPropertyDescriptor(HTMLElement.prototype, name)
);
beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
	vi.stubGlobal(
		'PointerEvent',
		class extends MouseEvent {
			pointerId: number;
			constructor(type: string, init: PointerEventInit) {
				super(type, init);
				this.pointerId = init.pointerId ?? 1;
			}
		}
	);
	for (const name of captureMethods)
		Object.defineProperty(HTMLElement.prototype, name, {
			configurable: true,
			value: vi.fn(() => true)
		});
	vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
		x: 100,
		y: 100,
		left: 100,
		top: 100,
		right: 300,
		bottom: 200,
		width: 200,
		height: 100,
		toJSON: () => ({})
	});
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	captureMethods.forEach((name, index) => {
		const original = originals[index];
		if (original) Object.defineProperty(HTMLElement.prototype, name, original);
		else Reflect.deleteProperty(HTMLElement.prototype, name);
	});
});
describe('canvas rotation controls', () => {
	it('holds the aspect ratio when dragging a corner with Shift', async () => {
		const element = { ...newElement('rectangle', 'shape'), width: 200, height: 100 };
		const view = render(SlideWorkspace, {
			definition: { ...blankSlide(), elements: [element] },
			selectedId: 'shape',
			timeMs: 0,
			tool: 'resize',
			zoom: 1,
			resetView: 0,
			viewportWidth: 1920,
			viewportHeight: 1080,
			onEdit: vi.fn()
		});
		const corner = view.getByRole('button', { name: 'Resize selected element from bottom right' });
		await fireEvent.pointerDown(corner, { pointerId: 1, button: 0, clientX: 200, clientY: 200 });
		await fireEvent.pointerMove(corner, {
			pointerId: 1,
			clientX: 210,
			clientY: 200,
			shiftKey: true
		});
		const overlay = view.container.querySelector('[data-element-overlay="shape"]') as HTMLElement;
		expect(parseFloat(overlay.style.width) / parseFloat(overlay.style.height)).toBeCloseTo(2);
		await fireEvent.pointerUp(corner, { pointerId: 1 });
	});

	it.each(['select', 'resize'] as const)(
		'types after a pointer-captured selection in %s mode',
		async (tool) => {
			const view = render(SlideWorkspace, {
				definition: {
					...blankSlide(),
					elements: [{ ...newElement('text', 'text'), text: 'Original' }]
				},
				timeMs: 0,
				tool,
				zoom: 1,
				resetView: 0,
				viewportWidth: 1920,
				viewportHeight: 1080,
				onEdit: vi.fn()
			});
			const button = view.getByRole('button', { name: 'Select element 1: text' });
			const workspace = view.getByRole('application', { name: 'Slide workspace' });
			await fireEvent.pointerDown(button, { pointerId: 1, button: 0 });
			await fireEvent.pointerUp(workspace, { pointerId: 1 });
			// With pointer capture, the browser dispatches click to the workspace, not the button.
			await fireEvent.click(workspace);
			expect(document.activeElement).toBe(button);
			await fireEvent.keyDown(document.activeElement!, { key: '!' });
			const input = view.getByRole('textbox', { name: 'Edit canvas text' });
			expect(input).toHaveFocus();
			expect(input).toHaveValue('Original!');
			await fireEvent.keyDown(input, { key: 'Escape' });
			await fireEvent.doubleClick(view.getByRole('button', { name: 'Select element 1: text' }));
			expect(view.getByRole('textbox', { name: 'Edit canvas text' })).toHaveValue('Original');
		}
	);
	it('edits text on the canvas, preserves multiline input, and cancels with Escape', async () => {
		const text = { ...newElement('text', 'text'), text: 'Original' };
		const view = render(SlideWorkspace, {
			definition: { ...blankSlide(), elements: [text] },
			selectedId: 'text',
			timeMs: 0,
			tool: 'select',
			zoom: 1,
			resetView: 0,
			viewportWidth: 1920,
			viewportHeight: 1080,
			onEdit: vi.fn()
		});
		await fireEvent.doubleClick(view.getByRole('button', { name: 'Select element 1: text' }));
		const input = view.getByRole('textbox', { name: 'Edit canvas text' });
		await fireEvent.input(input, { target: { value: 'Typed\ninside the slide' } });
		expect(input).toHaveValue('Typed\ninside the slide');
		await fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true });
		expect(view.queryByRole('textbox', { name: 'Edit canvas text' })).toBeNull();
		await fireEvent.doubleClick(view.getByRole('button', { name: 'Select element 1: text' }));
		await fireEvent.input(view.getByRole('textbox', { name: 'Edit canvas text' }), {
			target: { value: 'Discard' }
		});
		await fireEvent.keyDown(view.getByRole('textbox', { name: 'Edit canvas text' }), {
			key: 'Escape'
		});
		await fireEvent.doubleClick(view.getByRole('button', { name: 'Select element 1: text' }));
		expect(view.getByRole('textbox', { name: 'Edit canvas text' })).toHaveValue(
			'Typed\ninside the slide'
		);
		await fireEvent.keyDown(view.getByRole('textbox', { name: 'Edit canvas text' }), {
			key: 'Enter',
			ctrlKey: true
		});
		await fireEvent.keyDown(view.getByRole('button', { name: 'Select element 1: text' }), {
			key: '!'
		});
		expect(view.getByRole('textbox', { name: 'Edit canvas text' })).toHaveValue(
			'Typed\ninside the slide!'
		);
	});
	it('offers all eight resize handles in selection mode and resizes from the corresponding anchored edge', async () => {
		const view = render(SlideWorkspace, {
			definition: { ...blankSlide(), elements: [newElement('rectangle', 'shape')] },
			selectedId: 'shape',
			timeMs: 0,
			tool: 'select',
			zoom: 1,
			resetView: 0,
			viewportWidth: 1920,
			viewportHeight: 1080,
			onEdit: vi.fn()
		});
		expect(view.getAllByRole('button', { name: /^Resize selected element from / })).toHaveLength(8);
		const left = view.getByRole('button', { name: 'Resize selected element from left' });
		await fireEvent.keyDown(left, { key: 'ArrowLeft' });
		const overlay = view.container.querySelector('[data-element-overlay="shape"]') as HTMLElement;
		expect(overlay.style.transform).toContain('translate(1.59px,1.6px)');
		expect(overlay.style.width).toBe('8.01px');
		await fireEvent.keyDown(
			view.getByRole('button', { name: 'Resize selected element from top' }),
			{ key: 'ArrowUp' }
		);
		expect(overlay.style.transform).toContain('translate(1.59px,1.59px)');
	});
	it('rotates around the object center with pointer dragging, snapping, and keyboard control', async () => {
		const element = newElement('rectangle', 'shape');
		const definition = { ...blankSlide(), elements: [element] };
		const view = render(SlideWorkspace, {
			definition,
			selectedId: 'shape',
			timeMs: 0,
			tool: 'select',
			zoom: 1,
			resetView: 0,
			viewportWidth: 1920,
			viewportHeight: 1080,
			onEdit: vi.fn()
		});
		const overlay = () =>
			view.container.querySelector('[data-element-overlay="shape"]') as HTMLElement;
		const handle = view.getByRole('button', { name: 'Rotate selected element' });
		await fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 200, clientY: 100 });
		await fireEvent.pointerMove(handle, { pointerId: 1, clientX: 250, clientY: 150 });
		expect(overlay().style.transform).toContain('rotate(90deg)');
		await fireEvent.pointerMove(handle, {
			pointerId: 1,
			clientX: 250,
			clientY: 157,
			shiftKey: true
		});
		expect(overlay().style.transform).toContain('rotate(105deg)');
		await fireEvent.pointerUp(handle, { pointerId: 1 });
		await fireEvent.keyDown(handle, { key: 'ArrowLeft', shiftKey: true });
		expect(overlay().style.transform).toContain('rotate(90deg)');
		await fireEvent.keyDown(handle, { key: 'Home' });
		expect(overlay().style.transform).toContain('rotate(0deg)');
	});
});
