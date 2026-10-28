import { describe, expect, it } from 'vitest';
import { newElement } from './types';
import { moveElement, resizeDimensions, resizeElement } from './editor';

describe('canvas editing', () => {
	it('moves the base pose and animation together, clamping the entire path to valid coordinates', () => {
		const element = newElement('text', 'headline');
		element.keyframes = [{ ...element, x: 8000, y: 100, atMs: 1000, easing: 'linear' }];
		moveElement(element, 500, 20);
		expect(element.x).toBe(352);
		expect(element.keyframes[0].x).toBe(8192);
		expect(element.keyframes[0].y).toBe(120);
	});
	it('converts pointer movement through rotation and scale and bounds resized dimensions', () => {
		expect(resizeDimensions(100, 100, 40, 20, 0, 2)).toEqual({ width: 120, height: 110 });
		const rotated = resizeDimensions(100, 100, 0, 20, 90, 1);
		expect(rotated.width).toBeCloseTo(120);
		expect(rotated.height).toBeCloseTo(100);
		expect(resizeDimensions(10, 10, -100, 9000, 0, 1)).toEqual({ width: 1, height: 8192 });
	});
	it('keeps the opposite corner stationary when resizing a scaled element', () => {
		const element = newElement('rectangle', 'shape');
		element.x = 100;
		element.y = 100;
		element.width = 100;
		element.height = 100;
		element.scale = 2;
		const oldCorner = element.x + element.width / 2 - (element.width * element.scale) / 2;
		resizeElement(element, { width: 120, height: 100 }, 0, 2);
		expect(element.x + element.width / 2 - (element.width * element.scale) / 2).toBe(oldCorner);
	});
});
