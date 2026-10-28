import { describe, expect, it } from 'vitest';
import { blankSlide, type SlideDefinition } from './types';
import { slideContentTime, slideOpacityAt, slideTiming } from './timeline';
import { validateSlide } from './validation';
import { withResponsiveDefaults } from './layout';

describe('whole-slide transitions', () => {
	it('defaults new and legacy slides to independent 2000ms fades without changing saved data', () => {
		const legacy: Partial<SlideDefinition> = blankSlide();
		delete legacy.transitionIn;
		delete legacy.transitionOut;
		for (const slide of [
			blankSlide(),
			validateSlide(legacy),
			withResponsiveDefaults(legacy as SlideDefinition)
		]) {
			expect(slide.transitionIn).toEqual({ type: 'fade', durationMs: 2000 });
			expect(slide.transitionOut).toEqual({ type: 'fade', durationMs: 2000 });
		}
		expect(legacy).not.toHaveProperty('transitionIn');
		for (const [time, opacity] of [
			[0, 0],
			[1000, 0.5],
			[2000, 1],
			[12000, 1],
			[13000, 0.5],
			[14000, 0]
		])
			expect(slideOpacityAt(legacy as SlideDefinition, time)).toBe(opacity);
	});
	it('supports independent duration overrides and disabling either fade', () => {
		const slide = blankSlide();
		slide.transitionIn.durationMs = 1000;
		slide.transitionOut.durationMs = 3000;
		expect(slideOpacityAt(slide, 500)).toBe(0.5);
		expect(slideOpacityAt(slide, 12500)).toBe(0.5);
		slide.transitionIn.type = 'none';
		expect(slideOpacityAt(slide, 0)).toBe(1);
		slide.transitionOut.type = 'none';
		expect(slideOpacityAt(slide, 10000)).toBe(1);
		slide.transitionIn = { type: 'fade', durationMs: 0 };
		expect(slideOpacityAt(slide, 0)).toBe(1);
	});
	it('adds transitions to display duration and overrides without shortening them', () => {
		const slide = blankSlide();
		expect(slideTiming(slide)).toEqual({
			entranceMs: 2000,
			displayMs: 10000,
			exitMs: 2000,
			totalMs: 14000
		});
		expect(slideTiming(slide, 1000).totalMs).toBe(5000);
		expect(slideOpacityAt(slide, 1000, 1000)).toBe(0.5);
		expect(slideOpacityAt(slide, 2000, 1000)).toBe(1);
		expect(slideOpacityAt(slide, 3000, 1000)).toBe(1);
		expect(slideOpacityAt(slide, 4000, 1000)).toBe(0.5);
		expect(slideTiming(slide, 1000, false).totalMs).toBe(3000);
		expect(slideOpacityAt(slide, 3000, 1000, false)).toBe(1);
	});
	it('holds element animation time during entrance and exit transitions', () => {
		const slide = blankSlide();
		expect(slideContentTime(slide, 1000)).toBe(0);
		expect(slideContentTime(slide, 2500)).toBe(500);
		expect(slideContentTime(slide, 13000)).toBe(10000);
	});
	it('validates transition data before saving or importing it', () => {
		for (const transitionIn of [
			null,
			{ type: 'script', durationMs: 2000 },
			{ type: 'fade', durationMs: -1 },
			{ type: 'fade', durationMs: Infinity },
			{ type: 'fade', durationMs: 600001 }
		])
			expect(() => validateSlide({ ...blankSlide(), transitionIn })).toThrow();
		const custom = {
			...blankSlide(),
			transitionIn: { type: 'none', durationMs: 1000 },
			transitionOut: { type: 'fade', durationMs: 3000 }
		};
		expect(validateSlide(custom)).toEqual(custom);
	});
});
