import { describe, expect, it } from 'vitest';
import {
	adjacentKeyframe,
	editorShortcuts,
	parseTimelineTime,
	shortcutAction,
	shortcutText
} from './shortcuts';
import { constrainDimensions } from './editor';

describe('slide editor controls', () => {
	it('parses seconds and milliseconds and rejects ambiguous or invalid times', () => {
		expect(parseTimelineTime('2.5s')).toBe(2500);
		expect(parseTimelineTime('2000ms')).toBe(2000);
		expect(parseTimelineTime('0.125')).toBe(125);
		expect(parseTimelineTime(' 20 MS ')).toBe(20);
		for (const value of ['-1s', 'Infinity', '2 minutes', '', '1s junk'])
			expect(parseTimelineTime(value)).toBeUndefined();
	});
	it('finds strictly adjacent keyframes irrespective of stored order and duplicates', () => {
		expect(adjacentKeyframe([4000, 2000, 2000, 0], 0, 1)).toBe(2000);
		expect(adjacentKeyframe([4000, 2000, 0], 2500, -1)).toBe(2000);
		expect(adjacentKeyframe([0, 2000], 2000, 1)).toBeUndefined();
	});

	it('uses distinct shortcuts with exact declared modifiers', () => {
		expect(new Set(editorShortcuts.map(([, code, , modifiers]) => modifiers + code)).size).toBe(
			editorShortcuts.length
		);
		for (const [action, code, , modifiers] of editorShortcuts) {
			const event = {
				code,
				ctrlKey: modifiers.includes('Ctrl'),
				altKey: modifiers.includes('Alt'),
				shiftKey: modifiers.includes('Shift'),
				metaKey: false,
				target: null
			} as unknown as KeyboardEvent;
			expect(shortcutAction(event)).toBe(action);
			expect(modifiers.split('+').length).toBeLessThanOrEqual(2);
			if (modifiers) expect(shortcutText(action)).toContain(modifiers + '+');
			expect(shortcutAction({ ...event, ctrlKey: false, altKey: false, shiftKey: false })).toBe(
				editorShortcuts.find(
					([, bareCode, , bareModifiers]) => bareCode === code && bareModifiers === ''
				)?.[0]
			);
			expect(
				shortcutAction({ ...event, ctrlKey: true, altKey: true, shiftKey: true })
			).toBeUndefined();
			expect(shortcutAction({ ...event, defaultPrevented: true })).toBeUndefined();
			expect(shortcutAction({ ...event, isComposing: true })).toBeUndefined();
			expect(shortcutAction({ ...event, metaKey: true })).toBeUndefined();
		}
	});
	it('leaves browser navigation and menu shortcuts available', () => {
		for (const code of [
			'ArrowLeft',
			'ArrowRight',
			'Home',
			'KeyD',
			'KeyE',
			'KeyF',
			'KeyH',
			'KeyV'
		]) {
			expect(
				shortcutAction({
					code,
					ctrlKey: false,
					altKey: true,
					shiftKey: false,
					target: null
				} as unknown as KeyboardEvent)
			).toBeUndefined();
		}
		expect(shortcutText('text')).toBe('T');
		expect(shortcutText('rectangle')).toBe('R');
		expect(shortcutText('arrow')).toBe('Shift+L');
		expect(shortcutText('forward')).toBe('Ctrl+ArrowRight');
	});
	it('preserves aspect ratio and both minimum and maximum sizes', () => {
		expect(constrainDimensions(200, 100, { width: 300, height: 100 })).toEqual({
			width: 300,
			height: 150
		});
		expect(constrainDimensions(200, 100, { width: 8192, height: 8192 })).toEqual({
			width: 8192,
			height: 4096
		});
		expect(constrainDimensions(200, 100, { width: 1, height: 1 })).toEqual({ width: 2, height: 1 });
	});
});
