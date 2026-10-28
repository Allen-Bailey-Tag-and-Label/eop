import { describe, expect, it } from 'vitest';
import { resolveSlideColor } from './colors';
import { blankSlide, newElement } from './types';
import { validateSlide } from './validation';

describe('slide colors', () => {
	it('preserves fixed colors in both modes and resolves explicit light/dark pairs', () => {
		expect(resolveSlideColor('#123456', 'light')).toBe('#123456');
		expect(resolveSlideColor('#123456', 'dark')).toBe('#123456');
		expect(resolveSlideColor({ light: '#111111', dark: '#eeeeee' }, 'light')).toBe('#111111');
		expect(resolveSlideColor({ light: '#111111', dark: '#eeeeee' }, 'dark')).toBe('#eeeeee');
	});
	it('keeps existing fixed colors and transparent backgrounds when validating saved slides', () => {
		const slide = {
			...blankSlide(),
			background: 'transparent',
			elements: [{ ...newElement('text', 'headline'), color: '#123456' }]
		};
		expect(validateSlide(slide)).toEqual(slide);
		const themed = blankSlide();
		themed.elements = [newElement('text', 'headline')];
		expect(validateSlide(JSON.parse(JSON.stringify(themed)))).toEqual(themed);
	});
	it('rejects unsafe or incomplete pairs for backgrounds and elements', () => {
		for (const color of [
			{ light: '#ffffff' },
			{ light: 'url(https://example.com)', dark: '#000000' },
			{ light: '#ffffff', dark: 'transparent' },
			null
		]) {
			expect(() => validateSlide({ ...blankSlide(), background: color })).toThrow();
			expect(() =>
				validateSlide({ ...blankSlide(), elements: [{ ...newElement('text', 'headline'), color }] })
			).toThrow();
		}
	});
});
