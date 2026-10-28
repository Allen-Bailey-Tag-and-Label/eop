import type { Easing, Pose, SlideElement } from './types';
import { defaultSlideTransition, type SlideDefinition } from './types';

export function slideTiming(
	definition: SlideDefinition,
	durationMs = definition.durationMs,
	includeExit = true
) {
	const entrance = definition.transitionIn ?? defaultSlideTransition();
	const exit = definition.transitionOut ?? defaultSlideTransition();
	const entranceMs = entrance.type === 'fade' ? Math.max(0, entrance.durationMs) : 0;
	const exitMs = includeExit && exit.type === 'fade' ? Math.max(0, exit.durationMs) : 0;
	const displayMs = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0;
	return { entranceMs, displayMs, exitMs, totalMs: entranceMs + displayMs + exitMs };
}

export function slideContentTime(
	definition: SlideDefinition,
	timeMs: number,
	durationMs = definition.durationMs
) {
	const { entranceMs, displayMs } = slideTiming(definition, durationMs);
	return Math.max(0, Math.min(displayMs, timeMs - entranceMs));
}

// Transition time is additional to the display period; element keyframes use display time.
export function slideOpacityAt(
	definition: SlideDefinition,
	timeMs: number,
	durationMs = definition.durationMs,
	includeExit = true
) {
	const { entranceMs, exitMs, totalMs } = slideTiming(definition, durationMs, includeExit);
	const time = Math.max(0, Math.min(totalMs, timeMs));
	return Math.min(
		entranceMs > 0 ? time / entranceMs : 1,
		exitMs > 0 ? (totalMs - time) / exitMs : 1,
		1
	);
}

function ease(t: number, easing: Easing) {
	if (easing === 'ease-in') return t * t;
	if (easing === 'ease-out') return 1 - (1 - t) ** 2;
	if (easing === 'ease-in-out') return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
	return t;
}
export function poseAt(element: SlideElement, timeMs: number): Pose {
	let from: Pose & { atMs: number } = { ...element, atMs: 0 };
	for (const frame of element.keyframes) {
		if (timeMs >= frame.atMs) {
			from = frame;
			continue;
		}
		const t = ease(Math.max(0, (timeMs - from.atMs) / (frame.atMs - from.atMs)), frame.easing);
		const mix = (key: keyof Pose) => from[key] + (frame[key] - from[key]) * t;
		return {
			x: mix('x'),
			y: mix('y'),
			opacity: mix('opacity'),
			scale: mix('scale'),
			rotation: mix('rotation')
		};
	}
	return from;
}
