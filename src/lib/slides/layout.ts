import { normalizeDataSource } from './data-link';
import type { Pose, SlideDefinition, SlideElement } from './types';
import { defaultSlideTransition } from './types';

export type LayoutScales = {
	positionScaleX: number;
	positionScaleY: number;
	sizeScaleX: number;
	sizeScaleY: number;
};

// Missing constraints on pre-existing slides use proportional placement and sizing.
// Normalize editor data without modifying stored drafts or published snapshots.
export function withResponsiveDefaults(definition: SlideDefinition): SlideDefinition {
	const normalizeElement = (element: SlideElement): SlideElement => ({
		...element,
		...(element.dataSource ? { dataSource: normalizeDataSource(element.dataSource) } : {}),
		...(element.frame
			? { frame: { ...element.frame, elements: element.frame.elements.map(normalizeElement) } }
			: {}),
		...(element.repeater
			? {
					repeater: {
						...element.repeater,
						template: {
							...element.repeater.template,
							elements: element.repeater.template.elements.map(normalizeElement)
						}
					}
				}
			: {}),
		horizontalAnchor: element.horizontalAnchor ?? 'scale',
		verticalAnchor: element.verticalAnchor ?? 'scale'
	});
	return {
		...definition,
		transitionIn: definition.transitionIn ?? defaultSlideTransition(),
		transitionOut: definition.transitionOut ?? defaultSlideTransition(),
		elements: definition.elements.map(normalizeElement)
	};
}

function axis(
	position: number,
	size: number,
	reference: number,
	viewport: number,
	uniform: number,
	anchor: string
) {
	const proportional = viewport / reference;
	if (anchor === 'scale')
		return {
			position: position * proportional,
			size: size * proportional,
			positionScale: proportional,
			sizeScale: proportional
		};
	const offset =
		anchor === 'right' || anchor === 'bottom'
			? viewport - reference * uniform
			: anchor === 'center'
				? (viewport - reference * uniform) / 2
				: 0;
	return {
		position: position * uniform + offset,
		size:
			anchor === 'stretch' ? Math.max(1, viewport - (reference - size) * uniform) : size * uniform,
		positionScale: uniform,
		sizeScale: uniform
	};
}

// Evaluate layout after the animation pose so timelines use the same reference units as editing.
// Boxes may adapt independently; text and media contents retain their proportions.
export function elementLayout(
	definition: SlideDefinition,
	element: SlideElement,
	pose: Pose,
	viewportWidth: number,
	viewportHeight: number
) {
	const referenceWidth = Math.max(1, definition.width);
	const referenceHeight = Math.max(1, definition.height);
	const width = Math.max(0, viewportWidth);
	const height = Math.max(0, viewportHeight);
	const uniform = Math.min(width / referenceWidth, height / referenceHeight);
	const horizontal = axis(
		pose.x,
		element.width,
		referenceWidth,
		width,
		uniform,
		element.horizontalAnchor ?? 'scale'
	);
	const vertical = axis(
		pose.y,
		element.height,
		referenceHeight,
		height,
		uniform,
		element.verticalAnchor ?? 'scale'
	);
	return {
		...pose,
		x: horizontal.position,
		y: vertical.position,
		width: horizontal.size,
		height: vertical.size,
		fontSize: element.fontSize * uniform,
		positionScaleX: horizontal.positionScale,
		positionScaleY: vertical.positionScale,
		sizeScaleX: horizontal.sizeScale,
		sizeScaleY: vertical.sizeScale
	};
}
