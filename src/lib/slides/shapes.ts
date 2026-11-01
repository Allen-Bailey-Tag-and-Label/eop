import type { SlideElement } from './types';

export const isVectorShape = (type: string) => ['arrow', 'polygon', 'star'].includes(type);

// Fit the actual vertices to the element bounds, including odd-sided polygons.
export function shapeVertices(element: SlideElement, width: number, height: number, inset = 0) {
	const w = Math.max(0.01, width - 2 * inset);
	const h = Math.max(0.01, height - 2 * inset);
	let vertices: [number, number][];
	if (element.type === 'arrow') {
		const start = element.arrowHeads === 'start' || element.arrowHeads === 'both';
		const end = (element.arrowHeads ?? 'end') === 'end' || element.arrowHeads === 'both';
		const head = Math.min(w / 3, h);
		const half = Math.min(h, ((element.arrowWeight ?? 8) * width) / element.width) / 2;
		const left = start ? head : 0,
			right = end ? w - head : w;
		vertices = [
			[left, h / 2 - half],
			[right, h / 2 - half]
		];
		if (end) vertices.push([right, 0], [w, h / 2], [right, h]);
		vertices.push([right, h / 2 + half], [left, h / 2 + half]);
		if (start) vertices.push([left, h], [0, h / 2], [left, 0]);
	} else {
		const requested = element.shapePoints ?? (element.type === 'star' ? 5 : 3);
		const count = Number.isFinite(requested) ? Math.max(3, Math.min(60, Math.round(requested))) : 3;
		const star = element.type === 'star';
		vertices = Array.from({ length: count * (star ? 2 : 1) }, (_, index) => {
			const angle = -Math.PI / 2 + (2 * Math.PI * index) / (count * (star ? 2 : 1));
			const radius = star && index % 2 ? (element.starInnerRatio ?? 0.5) : 1;
			return [Math.cos(angle) * radius, Math.sin(angle) * radius];
		});
		const xs = vertices.map(([x]) => x),
			ys = vertices.map(([, y]) => y);
		const minX = Math.min(...xs),
			minY = Math.min(...ys);
		const spanX = Math.max(...xs) - minX,
			spanY = Math.max(...ys) - minY;
		vertices = vertices.map(([x, y]) => [((x - minX) / spanX) * w, ((y - minY) / spanY) * h]);
	}
	return vertices.map(([x, y]) => `${x + inset},${y + inset}`).join(' ');
}
