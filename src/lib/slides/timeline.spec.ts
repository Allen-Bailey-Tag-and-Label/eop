import { describe, expect, it } from 'vitest';
import { blankSlide, type SlideDefinition } from './types';
import { slideOpacityAt } from './timeline';
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
			[8000, 1],
			[9000, 0.5],
			[10000, 0]
		])
			expect(slideOpacityAt(legacy as SlideDefinition, time)).toBe(opacity);
	});
	it('supports independent duration overrides and disabling either fade', () => {
		const slide = blankSlide();
		slide.transitionIn.durationMs = 1000;
		slide.transitionOut.durationMs = 3000;
		expect(slideOpacityAt(slide, 500)).toBe(0.5);
		expect(slideOpacityAt(slide, 8500)).toBe(0.5);
		slide.transitionIn.type = 'none';
		expect(slideOpacityAt(slide, 0)).toBe(1);
		slide.transitionOut.type = 'none';
		expect(slideOpacityAt(slide, 10000)).toBe(1);
		slide.transitionIn = { type: 'fade', durationMs: 0 };
		expect(slideOpacityAt(slide, 0)).toBe(1);
	});
	it('fits fades inside a shorter playlist duration and holds non-looping final slides visibly', () => {
		const slide = blankSlide();
		expect(slideOpacityAt(slide, 250, 1000)).toBe(0.5);
		expect(slideOpacityAt(slide, 500, 1000)).toBe(1);
		expect(slideOpacityAt(slide, 750, 1000)).toBe(0.5);
		expect(slideOpacityAt(slide, 1000, 1000, false)).toBe(1);
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
