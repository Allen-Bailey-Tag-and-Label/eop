import type { Easing, Pose, SlideElement } from './types';
import { defaultSlideTransition, type SlideDefinition } from './types';

// Whole-slide fades include the background and compose with element animations.
export function slideOpacityAt(
	definition: SlideDefinition,
	timeMs: number,
	durationMs = definition.durationMs,
	includeExit = true
) {
	if (!Number.isFinite(durationMs) || durationMs <= 0) return 1;
	const entrance = definition.transitionIn ?? defaultSlideTransition();
	const exit = definition.transitionOut ?? defaultSlideTransition();
	const fadeIn = entrance.type === 'fade' ? entrance.durationMs : 0;
	const fadeOut = includeExit && exit.type === 'fade' ? exit.durationMs : 0;
	const scale = Math.min(1, durationMs / Math.max(1, fadeIn + fadeOut));
	const time = Math.max(0, Math.min(durationMs, timeMs));
	return Math.min(
		fadeIn > 0 ? time / (fadeIn * scale) : 1,
		fadeOut > 0 ? (durationMs - time) / (fadeOut * scale) : 1,
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
