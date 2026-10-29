import { describe, expect, it } from 'vitest';
import { newElement } from './types';
import {
	moveElement,
	resizeDimensions,
	resizeElement,
	rotateElement,
	rotationDelta,
	reorderLayers
} from './editor';

describe('canvas editing', () => {
	it('keeps the opposite edge or corner fixed for all eight resize handles, including rotated scaled objects', () => {
		for (const handle of [
			{ x: -1, y: -1 },
			{ x: 0, y: -1 },
			{ x: 1, y: -1 },
			{ x: -1, y: 0 },
			{ x: 1, y: 0 },
			{ x: -1, y: 1 },
			{ x: 0, y: 1 },
			{ x: 1, y: 1 }
		] as const) {
			for (const rotation of [0, 37, 90]) {
				const element = {
					...newElement('rectangle', 'box'),
					width: 100,
					height: 80,
					rotation,
					scale: 1.5
				};
				const point = () => {
					const x = (-handle.x * element.width) / 2,
						y = (-handle.y * element.height) / 2,
						r = (rotation * Math.PI) / 180;
					return {
						x: element.x + element.width / 2 + element.scale * (x * Math.cos(r) - y * Math.sin(r)),
						y: element.y + element.height / 2 + element.scale * (x * Math.sin(r) + y * Math.cos(r))
					};
				};
				const before = point();
				resizeElement(
					element,
					{ width: handle.x ? 120 : 100, height: handle.y ? 110 : 80 },
					rotation,
					1.5,
					undefined,
					handle
				);
				expect(point().x).toBeCloseTo(before.x);
				expect(point().y).toBeCloseTo(before.y);
			}
		}
	});
	it('inserts layers before or after a target without changing objects or the original order', () => {
		const elements = ['a', 'b', 'c', 'd'].map((id) => newElement('text', id));
		expect(reorderLayers(elements, 'a', 'c').map((element) => element.id)).toEqual([
			'b',
			'a',
			'c',
			'd'
		]);
		const reordered = reorderLayers(elements, 'a', 'd', true);
		expect(reordered.map((element) => element.id)).toEqual(['b', 'c', 'd', 'a']);
		expect(reordered[3]).toBe(elements[0]);
		expect(reorderLayers(elements, 'd', 'a').map((element) => element.id)).toEqual([
			'd',
			'a',
			'b',
			'c'
		]);
		expect(reorderLayers(elements, 'd', 'b', true).map((element) => element.id)).toEqual([
			'a',
			'b',
			'd',
			'c'
		]);
		expect(elements.map((element) => element.id)).toEqual(['a', 'b', 'c', 'd']);
		for (const [source, target, after] of [
			['a', 'a', false],
			['a', 'b', false],
			['b', 'a', true],
			['missing', 'a', false],
			['a', 'missing', true]
		] as const) {
			expect(reorderLayers(elements, source, target, after)).toBe(elements);
		}
	});
	it('rotates animated objects together, bounds the entire path, and crosses angle seams', () => {
		const element = newElement('text', 'headline');
		element.keyframes = [{ ...element, rotation: 30, atMs: 1000, easing: 'linear' }];
		rotateElement(element, 90);
		expect(element.rotation).toBe(90);
		expect(element.keyframes[0].rotation).toBe(120);
		rotateElement(element, 4000);
		expect(element.rotation).toBe(3570);
		expect(element.keyframes[0].rotation).toBe(3600);
		expect(rotationDelta(179, -179)).toBe(2);
		expect(rotationDelta(-179, 179)).toBe(-2);
	});
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
