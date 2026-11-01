<script lang="ts">
	import { defaultBorderColor, type SlideElement, type ColorScheme } from './types';
	import { resolveSlideColor } from './colors';
	import { shapeVertices } from './shapes';
	let {
		element,
		width,
		height,
		scheme,
		unit
	}: {
		element: SlideElement;
		width: number;
		height: number;
		scheme: ColorScheme;
		unit: number;
	} = $props();
	const maskId = $props.id();
	const strokeWidth = $derived(Math.min((element.borderWidth ?? 0) * unit, width / 2, height / 2));
	const points = $derived(shapeVertices(element, width, height, strokeWidth / 2));
	const dash = $derived(
		element.borderStyle === 'dashed'
			? `${strokeWidth * 3} ${strokeWidth * 2}`
			: element.borderStyle === 'dotted'
				? `${strokeWidth} ${strokeWidth}`
				: undefined
	);
</script>

<svg
	width="100%"
	height="100%"
	viewBox={`0 0 ${width} ${height}`}
	preserveAspectRatio="none"
	role="img"
	aria-label={`${element.type} shape`}
>
	{#if element.borderStyle === 'double' && strokeWidth > 0}
		<defs
			><mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" {width} {height}>
				<polygon
					{points}
					fill="none"
					stroke="white"
					stroke-width={strokeWidth}
					stroke-linejoin="round"
				/>
				<polygon
					{points}
					fill="none"
					stroke="black"
					stroke-width={strokeWidth / 3}
					stroke-linejoin="round"
				/>
			</mask></defs
		>
		<polygon {points} fill={resolveSlideColor(element.color, scheme)} />
		<polygon
			{points}
			fill="none"
			stroke={resolveSlideColor(element.borderColor ?? defaultBorderColor, scheme)}
			stroke-width={strokeWidth}
			stroke-linejoin="round"
			mask={`url(#${maskId})`}
		/>
	{:else}
		<polygon
			{points}
			fill={resolveSlideColor(element.color, scheme)}
			stroke={resolveSlideColor(element.borderColor ?? defaultBorderColor, scheme)}
			stroke-width={strokeWidth}
			stroke-dasharray={dash}
			stroke-linejoin="round"
		/>
	{/if}
</svg>
