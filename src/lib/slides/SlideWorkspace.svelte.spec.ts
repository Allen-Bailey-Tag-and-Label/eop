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
