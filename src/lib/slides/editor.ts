import type { SlideElement } from './types';

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
	const radians = (rotation * Math.PI) / 180;
	const divisor = Math.max(scale, 0.01);
	return {
		width: Math.max(
			1,
			Math.min(8192, width + (dx * Math.cos(radians) + dy * Math.sin(radians)) / divisor)
		),
		height: Math.max(
			1,
			Math.min(8192, height + (-dx * Math.sin(radians) + dy * Math.cos(radians)) / divisor)
		)
	};
}

// CSS scales and rotates around the center. Adjust position to keep the opposite corner fixed.
export function resizeElement(
	element: SlideElement,
	dimensions: { width: number; height: number },
	rotation: number,
	scale: number
) {
	const radians = (rotation * Math.PI) / 180;
	const halfWidth = (dimensions.width - element.width) / 2;
	const halfHeight = (dimensions.height - element.height) / 2;
	moveElement(
		element,
		(scale * Math.cos(radians) - 1) * halfWidth - scale * Math.sin(radians) * halfHeight,
		scale * Math.sin(radians) * halfWidth + (scale * Math.cos(radians) - 1) * halfHeight
	);
	Object.assign(element, dimensions);
}
