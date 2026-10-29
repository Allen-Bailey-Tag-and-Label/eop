import { describe, expect, it } from 'vitest';
import { blankSlide } from './types';
import { validatePlaylist, validateSlide } from './validation';
import { withResponsiveDefaults } from './layout';
import {
	playlistContentTime,
	playlistSlideTiming,
	transitionProgress,
	withPlaylistDefaults
} from './playlist-transitions';

const playlist = () => ({ loop: true, items: [{ slideId: 'a'.repeat(24), durationMs: null }] });
describe('playlist transitions', () => {
	it('defaults legacy playlists to a two-second crossfade without mutating saved content', () => {
		const legacy = playlist();
		expect(validatePlaylist(legacy).transition).toEqual({ type: 'crossfade', durationMs: 2000 });
		expect(withPlaylistDefaults(legacy).transition).toEqual({
			type: 'crossfade',
			durationMs: 2000
		});
		expect(legacy).not.toHaveProperty('transition');
	});
	it('removes legacy slide transitions when loading and importing without changing element keyframes', () => {
		const legacy = {
			...blankSlide(),
			transitionIn: { type: 'fade', durationMs: 8000 },
			transitionOut: { type: 'fade', durationMs: 8000 }
		};
		for (const slide of [blankSlide(), validateSlide(legacy), withResponsiveDefaults(legacy)]) {
			expect(slide).not.toHaveProperty('transitionIn');
			expect(slide).not.toHaveProperty('transitionOut');
			expect(slide.durationMs).toBe(10000);
		}
		expect(legacy.transitionIn.durationMs).toBe(8000);
	});
	it('counts down through entrance and hold while the outgoing slide overlaps the next entrance', () => {
		expect(playlistSlideTiming(10000)).toEqual({
			entranceMs: 2000,
			displayMs: 10000,
			totalMs: 12000
		});
		expect(playlistSlideTiming(10000, { type: 'none', durationMs: 2000 }).totalMs).toBe(10000);
		expect(transitionProgress(1000, 2000)).toBe(0.5);
		expect(transitionProgress(3000, 2000)).toBe(1);
		expect(transitionProgress(0, 0)).toBe(1);
		expect(playlistContentTime(1000, 2000, 10000)).toBe(0);
		expect(playlistContentTime(2500, 2000, 10000)).toBe(500);
		expect(playlistContentTime(20000, 2000, 10000)).toBe(10000);
	});
	it('validates defaults and per-entry overrides and rejects invalid transition settings', () => {
		for (const transition of [
			null,
			{ type: 'fade', durationMs: 2000 },
			{ type: 'crossfade', durationMs: -1 },
			{ type: 'crossfade', durationMs: Infinity },
			{ type: 'crossfade', durationMs: 60001 }
		]) {
			expect(() => validatePlaylist({ ...playlist(), transition })).toThrow();
			expect(() =>
				validatePlaylist({ ...playlist(), items: [{ ...playlist().items[0], transition }] })
			).toThrow();
		}
		const custom = {
			...playlist(),
			transition: { type: 'none', durationMs: 2000 },
			items: [{ ...playlist().items[0], transition: { type: 'crossfade', durationMs: 3500 } }]
		};
		expect(validatePlaylist(custom)).toEqual(custom);
	});
});
