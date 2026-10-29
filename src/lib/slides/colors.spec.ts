import { describe, expect, it } from 'vitest';
import {
	resolveSlideColor,
	colorRgb,
	colorOpacity,
	withColorRgb,
	withColorOpacity,
	hasColorTransparency
} from './colors';
import { blankSlide, newElement } from './types';
import { validateSlide } from './validation';

describe('slide colors', () => {
	it('edits RGB without losing alpha and converts opacity to bounded RGBA colors', () => {
		expect(colorRgb('#11223380')).toBe('#112233');
		expect(colorOpacity('#11223380')).toBe(50);
		expect(withColorRgb('#11223380', '#abcdef')).toBe('#abcdef80');
		expect(withColorRgb('transparent', '#abcdef')).toBe('#abcdef00');
		expect(withColorOpacity('#112233', 50)).toBe('#11223380');
		expect(withColorOpacity('#11223380', 100)).toBe('#112233');
		expect(withColorOpacity('#112233', -5)).toBe('#11223300');
		expect(withColorOpacity('#112233', 105)).toBe('#112233');
		expect(withColorOpacity('#112233', NaN)).toBe('#112233');
		expect(colorOpacity('transparent')).toBe(0);
		expect(hasColorTransparency('#112233fe')).toBe(true);
		expect(hasColorTransparency('#112233ff')).toBe(false);
	});
	it('round-trips transparent and translucent fixed and themed colors in every color property', () => {
		for (const color of [
			'transparent',
			'#11223300',
			'#11223380',
			{ light: '#12345680', dark: 'transparent' }
		]) {
			const slide = {
				...blankSlide(),
				background: color,
				elements: [
					{ ...newElement('text', 'text'), color, backgroundColor: color, borderColor: color }
				]
			};
			expect(validateSlide(JSON.parse(JSON.stringify(slide)))).toEqual(slide);
		}
	});
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
			{ light: '#ffffff', dark: '#0000000' },
			'#ffffffgg',
			'rgba(0,0,0,0)',
			null
		]) {
			expect(() => validateSlide({ ...blankSlide(), background: color })).toThrow();
			expect(() =>
				validateSlide({ ...blankSlide(), elements: [{ ...newElement('text', 'headline'), color }] })
			).toThrow();
		}
	});
});
