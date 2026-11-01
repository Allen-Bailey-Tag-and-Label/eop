import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/svelte';
import { numberScrub } from './numberScrub';

afterEach(() => vi.unstubAllGlobals());
describe('numeric input scrubbing', () => {
	it('retains native clicking and typing, emits updates while dragging and restores cancelled drags', async () => {
		vi.stubGlobal(
			'PointerEvent',
			class extends MouseEvent {
				pointerId = 1;
			}
		);
		const input = document.createElement('input');
		input.type = 'number';
		input.min = '0';
		input.max = '1';
		input.step = '0.1';
		input.value = '0.5';
		const change = vi.fn();
		input.addEventListener('change', change);
		const detach = numberScrub(input);
		try {
			await fireEvent.pointerDown(input, { button: 0, clientX: 100 });
			await fireEvent.pointerUp(window);
			expect(change).not.toHaveBeenCalled();
			await fireEvent.input(input, { target: { value: '0.6' } });
			await fireEvent.pointerDown(input, { button: 0, clientX: 100 });
			await fireEvent.pointerMove(window, { clientX: 108 });
			expect(input.value).toBe('0.8');
			expect(change).toHaveBeenCalledOnce();
			await fireEvent.pointerMove(window, { clientX: 500 });
			expect(input.value).toBe('1');
			await fireEvent.pointerCancel(window);
			expect(input.value).toBe('0.6');
		} finally {
			if (typeof detach === 'function') detach();
		}
	});
});
