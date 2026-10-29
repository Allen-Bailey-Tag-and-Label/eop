import type { FrameDefinition, SlideDefinition, SlideElement } from './types';
import { blankSlide } from './types';
import { paddingSides } from './padding';
import type { elementLayout } from './layout';
import { poseAt } from './timeline';

// Frames and one repeater template can be nested up to the validator's depth limit.
export function assetReferencePaths(prefix: string, depth = 0, template = false): string[] {
	return [
		`${prefix}.assetId`,
		...(depth < 8 ? assetReferencePaths(`${prefix}.frame.elements`, depth + 1, template) : []),
		...(!template && depth < 8
			? assetReferencePaths(`${prefix}.repeater.template.elements`, depth + 1, true)
			: [])
	];
}

export function frameAt(elements: SlideElement[], path: string[]): SlideElement | undefined {
	let frame: SlideElement | undefined;
	for (const id of path) {
		frame = elements.find((item) => item.id === id && item.frame);
		if (!frame?.frame) return;
		elements = frame.frame.elements;
	}
	return frame;
}

export const sameFramePath = (a: string[], b: string[]) =>
	a.length === b.length && a.every((part, index) => part === b[index]);
export const framePathStartsWith = (path: string[], prefix: string[]) =>
	prefix.length <= path.length && prefix.every((part, index) => part === path[index]);
export function listFrames(
	elements: SlideElement[],
	excluded: string[] = [],
	path: string[] = [],
	names: string[] = []
): { path: string[]; label: string }[] {
	return elements.flatMap((element) => {
		if (!element.frame) return [];
		const next = [...path, element.id],
			labels = [...names, element.text || 'Frame'];
		if (excluded.length && framePathStartsWith(next, excluded)) return [];
		return [
			{ path: next, label: labels.join(' / ') },
			...listFrames(element.frame.elements, excluded, next, labels)
		];
	});
}
function nestedDepth(element: SlideElement): number {
	const children = element.frame?.elements ?? element.repeater?.template.elements;
	return children ? 1 + Math.max(0, ...children.map(nestedDepth)) : 0;
}
export function moveLayer(
	elements: SlideElement[],
	sourcePath: string[],
	id: string,
	destinationPath: string[],
	options: { baseDepth?: number; prepare?: (element: SlideElement) => void } = {}
) {
	if (sameFramePath(sourcePath, destinationPath)) return;
	if (framePathStartsWith(destinationPath, [...sourcePath, id]))
		throw new Error('A frame cannot be moved inside itself or one of its children.');
	const sourceFrame = frameAt(elements, sourcePath),
		destinationFrame = frameAt(elements, destinationPath);
	if (
		(sourcePath.length && !sourceFrame?.frame) ||
		(destinationPath.length && !destinationFrame?.frame)
	)
		throw new Error('This frame no longer exists.');
	const source = sourceFrame?.frame?.elements ?? elements,
		destination = destinationFrame?.frame?.elements ?? elements;
	const index = source.findIndex((element) => element.id === id),
		element = source[index];
	if (!element) throw new Error('This layer no longer exists.');
	if (destination.some((item) => item.id === id))
		throw new Error(
			'The destination already contains a layer with this ID. Choose a different frame.'
		);
	if (destinationPath.length + nestedDepth(element) + (options.baseDepth ?? 0) > 8)
		throw new Error('Use at most eight nested frame/template levels.');
	options.prepare?.(element);
	let shared = 0;
	while (
		shared < sourcePath.length &&
		shared < destinationPath.length &&
		sourcePath[shared] === destinationPath[shared]
	)
		shared++;
	for (let i = sourcePath.length; i > shared; i--)
		reparentElement(element, frameAt(elements, sourcePath.slice(0, i))!, false);
	for (let i = shared + 1; i <= destinationPath.length; i++)
		reparentElement(element, frameAt(elements, destinationPath.slice(0, i))!, true);
	source.splice(index, 1);
	destination.push(element);
	return element;
}
export function frameSlide(element: SlideElement, durationMs: number): SlideDefinition {
	const p = paddingSides(element.padding);
	return {
		...blankSlide(),
		width: Math.max(1, element.width - p.left - p.right),
		height: Math.max(1, element.height - p.top - p.bottom),
		background: 'transparent',
		durationMs,
		elements: element.frame?.elements ?? []
	};
}
// Convert poses between the parent's content coordinates and its containing canvas.
export function reparentElement(element: SlideElement, parent: SlideElement, into: boolean) {
	const padding = paddingSides(parent.padding);
	for (const pose of [element, ...element.keyframes]) {
		const frame = 'atMs' in pose ? poseAt(parent, pose.atMs) : parent;
		const r = (frame.rotation * Math.PI) / 180,
			scale = Math.max(0.01, frame.scale);
		const cx = frame.x + parent.width / 2,
			cy = frame.y + parent.height / 2;
		let x = pose.x + element.width / 2,
			y = pose.y + element.height / 2;
		if (into) {
			const dx = x - cx,
				dy = y - cy;
			x = (dx * Math.cos(r) + dy * Math.sin(r)) / scale + parent.width / 2 - padding.left;
			y = (-dx * Math.sin(r) + dy * Math.cos(r)) / scale + parent.height / 2 - padding.top;
		} else {
			const dx = x + padding.left - parent.width / 2,
				dy = y + padding.top - parent.height / 2;
			x = cx + scale * (dx * Math.cos(r) - dy * Math.sin(r));
			y = cy + scale * (dx * Math.sin(r) + dy * Math.cos(r));
		}
		pose.x = Math.max(-8192, Math.min(8192, x - element.width / 2));
		pose.y = Math.max(-8192, Math.min(8192, y - element.height / 2));
		pose.rotation = Math.max(
			-3600,
			Math.min(3600, pose.rotation + (into ? -frame.rotation : frame.rotation))
		);
		pose.scale = Math.max(0, Math.min(10, into ? pose.scale / scale : pose.scale * scale));
	}
}
export function frameLayoutStyle(frame: FrameDefinition | undefined, unit: number) {
	if (!frame || frame.layout === 'free') return '';
	return `display:${frame.layout === 'grid' ? 'grid' : 'flex'};${frame.layout === 'grid' ? `grid-template-columns:repeat(${frame.columns},minmax(0,1fr));grid-auto-rows:minmax(0,1fr);` : `flex-direction:${frame.layout};flex-wrap:${frame.wrap ? 'wrap' : 'nowrap'};`}column-gap:${frame.columnGap * unit}px;row-gap:${frame.rowGap * unit}px;align-items:${frame.align};justify-content:${frame.justify};align-content:${frame.justify === 'space-between' ? 'space-between' : frame.justify};`;
}
type Box = ReturnType<typeof elementLayout>;
export function elementPositionStyle(
	element: SlideElement,
	box: Box,
	base: Box,
	flow?: FrameDefinition
) {
	const auto = flow && flow.layout !== 'free';
	const fill =
		element.layoutSizing === 'fill' ||
		(element.layoutSizing === undefined && flow?.layout === 'grid');
	let width = `${box.width}px`,
		height = `${box.height}px`;
	if (auto) {
		if (flow.layout === 'grid') {
			if (fill) {
				width = '100%';
				height = '100%';
			}
		} else if (flow.layout === 'row') {
			if (fill) width = '0px';
			if (fill && flow.align === 'stretch') height = '100%';
		} else {
			if (fill) height = '0px';
			if (fill && flow.align === 'stretch') width = '100%';
		}
	}
	return `position:${auto ? 'relative' : 'absolute'};${auto ? 'min-width:0;min-height:0;' + (flow.layout !== 'grid' ? `flex:${fill ? '1 1 0' : '0 0 auto'};` : '') : 'left:0;top:0;'}width:${width};height:${height};transform:translate(${auto ? box.x - base.x : box.x}px,${auto ? box.y - base.y : box.y}px) rotate(${box.rotation}deg) scale(${box.scale});transform-origin:center;`;
}
