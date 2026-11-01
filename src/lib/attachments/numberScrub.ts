import type { Attachment } from 'svelte/attachments';

export const numberScrubContext = Symbol('numberScrub');

// Wait for an actual drag so clicking, selecting and typing keep their native behavior.
export const numberScrub: Attachment<HTMLInputElement> = (input) => {
	let drag: { id: number; x: number; value: number; original: string; active: boolean } | undefined;
	const emit = (value: string) => {
		input.value = value;
		input.dispatchEvent(new Event('input', { bubbles: true }));
		input.dispatchEvent(new Event('change', { bubbles: true }));
	};
	const down = (event: PointerEvent) => {
		if (event.button || input.disabled || input.readOnly || input.type !== 'number') return;
		drag = {
			id: event.pointerId,
			x: event.clientX,
			value: Number(input.value) || 0,
			original: input.value,
			active: false
		};
	};
	const move = (event: PointerEvent) => {
		if (!drag || drag.id !== event.pointerId) return;
		const delta = event.clientX - drag.x;
		if (!drag.active && Math.abs(delta) < 4) return;
		drag.active = true;
		event.preventDefault();
		input.setPointerCapture?.(event.pointerId);
		const step = input.step === 'any' ? 0.1 : Number(input.step) || 1;
		const min = input.min === '' ? -Infinity : Number(input.min);
		const max = input.max === '' ? Infinity : Number(input.max);
		const base = Number.isFinite(min) ? min : 0;
		const next = drag.value + Math.round(delta / 4) * step * (event.shiftKey ? 10 : 1);
		const snapped = base + Math.round((next - base) / step) * step;
		emit(String(Number(Math.max(min, Math.min(max, snapped)).toFixed(8))));
	};
	const stop = (event: PointerEvent) => {
		if (!drag || drag.id !== event.pointerId) return;
		const active = drag.active;
		drag = undefined;
		if (active && input.hasPointerCapture?.(event.pointerId))
			input.releasePointerCapture(event.pointerId);
	};
	const cancel = (event: PointerEvent) => {
		if (drag?.id === event.pointerId && drag.active) emit(drag.original);
		stop(event);
	};
	input.addEventListener('pointerdown', down);
	window.addEventListener('pointermove', move, { passive: false });
	window.addEventListener('pointerup', stop);
	window.addEventListener('pointercancel', cancel);
	return () => {
		input.removeEventListener('pointerdown', down);
		window.removeEventListener('pointermove', move);
		window.removeEventListener('pointerup', stop);
		window.removeEventListener('pointercancel', cancel);
	};
};
