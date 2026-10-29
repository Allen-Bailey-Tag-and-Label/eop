import {
	defaultPlaylistTransition,
	type PlaylistDefinition,
	type PlaylistTransition
} from './types';

export function withPlaylistDefaults(definition: PlaylistDefinition): PlaylistDefinition {
	return { ...definition, transition: definition.transition ?? defaultPlaylistTransition() };
}

export function transitionDuration(transition: PlaylistTransition = defaultPlaylistTransition()) {
	return transition.type === 'crossfade' ? Math.max(0, transition.durationMs) : 0;
}

export function transitionProgress(timeMs: number, durationMs: number) {
	return durationMs > 0 ? Math.max(0, Math.min(1, timeMs / durationMs)) : 1;
}

export function playlistSlideTiming(durationMs: number, transition?: PlaylistTransition) {
	const entranceMs = transitionDuration(transition);
	return { entranceMs, displayMs: durationMs, totalMs: entranceMs + durationMs };
}

export function playlistContentTime(timeMs: number, entranceMs: number, durationMs: number) {
	return Math.max(0, Math.min(durationMs, timeMs - entranceMs));
}
