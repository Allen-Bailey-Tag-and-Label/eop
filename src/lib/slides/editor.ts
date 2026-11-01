import type { SlideElement } from './types';
import type { LayoutScales } from './layout';
export type ResizeHandle = { x: -1 | 0 | 1; y: -1 | 0 | 1 };
export const resizeHandles = [
	{ x: -1, y: -1, name: 'top left', cursor: 'nwse-resize' },
	{ x: 0, y: -1, name: 'top', cursor: 'ns-resize' },
	{ x: 1, y: -1, name: 'top right', cursor: 'nesw-resize' },
	{ x: -1, y: 0, name: 'left', cursor: 'ew-resize' },
	{ x: 1, y: 0, name: 'right', cursor: 'ew-resize' },
	{ x: -1, y: 1, name: 'bottom left', cursor: 'nesw-resize' },
	{ x: 0, y: 1, name: 'bottom', cursor: 'ns-resize' },
	{ x: 1, y: 1, name: 'bottom right', cursor: 'nwse-resize' }
] as const;

// Move the whole animation path, rather than changing a base pose that keyframes override.
export function moveElement(element: SlideElement, dx: number, dy: number) {
	const poses = [element, ...element.keyframes];
	const boundedX = Math.max(
		-8192 - Math.min(...poses.map((pose) => pose.x)),
		Math.min(dx, 8192 - Math.max(...poses.map((pose) => pose.x)))
	);
	const boundedY = Math.max(
		-8192 - Math.min(...poses.map((pose) => pose.y)),
		Math.min(dy, 8192 - Math.max(...poses.map((pose) => pose.y)))
	);
	for (const pose of poses) {
		pose.x += boundedX;
		pose.y += boundedY;
	}
}

export function resizeDimensions(
	width: number,
	height: number,
	dx: number,
	dy: number,
	rotation: number,
	scale: number
) {
	const delta = resizeDelta(dx, dy, rotation, scale);
	return {
		width: Math.max(1, Math.min(8192, width + delta.width)),
		height: Math.max(1, Math.min(8192, height + delta.height))
	};
}

export function resizeDelta(dx: number, dy: number, rotation: number, scale: number) {
	const radians = (rotation * Math.PI) / 180;
	const divisor = Math.max(scale, 0.01);
	return {
		width: (dx * Math.cos(radians) + dy * Math.sin(radians)) / divisor,
		height: (-dx * Math.sin(radians) + dy * Math.cos(radians)) / divisor
	};
}

export function constrainDimensions(
	width: number,
	height: number,
	next: { width: number; height: number }
) {
	const factor =
		Math.abs(next.width / width - 1) >= Math.abs(next.height / height - 1)
			? next.width / width
			: next.height / height;
	const bounded = Math.max(
		1 / Math.min(width, height),
		Math.min(8192 / Math.max(width, height), factor)
	);
	return { width: width * bounded, height: height * bounded };
}

// CSS scales and rotates around the center. Adjust position to keep the opposite corner fixed.
export function resizeElement(
	element: SlideElement,
	dimensions: { width: number; height: number },
	rotation: number,
	scale: number,
	layout: LayoutScales = { positionScaleX: 1, positionScaleY: 1, sizeScaleX: 1, sizeScaleY: 1 },
	handle: ResizeHandle = { x: 1, y: 1 },
	aspect?: { width: number; height: number }
) {
	if (aspect) dimensions = constrainDimensions(aspect.width, aspect.height, dimensions);
	const radians = (rotation * Math.PI) / 180;
	const halfWidth = ((dimensions.width - element.width) * layout.sizeScaleX) / 2;
	const halfHeight = ((dimensions.height - element.height) * layout.sizeScaleY) / 2;
	moveElement(
		element,
		((scale * Math.cos(radians) * handle.x - 1) * halfWidth -
			scale * Math.sin(radians) * halfHeight * handle.y) /
			Math.max(0.0001, layout.positionScaleX),
		(scale * Math.sin(radians) * halfWidth * handle.x +
			(scale * Math.cos(radians) * handle.y - 1) * halfHeight) /
			Math.max(0.0001, layout.positionScaleY)
	);
	Object.assign(element, dimensions);
}

// Rotate the full animation path so keyframes cannot undo an object-property edit.
export function rotateElement(element: SlideElement, degrees: number) {
	if (!Number.isFinite(degrees)) return;
	const poses = [element, ...element.keyframes];
	const bounded = Math.max(
		-3600 - Math.min(...poses.map((pose) => pose.rotation)),
		Math.min(degrees, 3600 - Math.max(...poses.map((pose) => pose.rotation)))
	);
	for (const pose of poses) pose.rotation += bounded;
}

// Short signed angle changes allow dragging across the -180/180 degree boundary.
export function rotationDelta(previous: number, next: number) {
	return ((((next - previous + 540) % 360) + 360) % 360) - 180;
}

// Return a new stacking order; element identities, animation paths, and styles stay intact.
export function reorderLayers(
	elements: SlideElement[],
	sourceId: string,
	targetId: string,
	after = false
) {
	const source = elements.findIndex((element) => element.id === sourceId);
	const target = elements.findIndex((element) => element.id === targetId);
	if (source < 0 || target < 0 || source === target) return elements;
	let destination = target + (after ? 1 : 0);
	if (source < destination) destination--;
	if (source === destination) return elements;
	const reordered = [...elements];
	const [element] = reordered.splice(source, 1);
	reordered.splice(destination, 0, element);
	return reordered;
}
