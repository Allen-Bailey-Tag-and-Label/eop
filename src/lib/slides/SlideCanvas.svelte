<script lang="ts">
	import { Div } from '$lib/components';
	import { poseAt, slideContentTime, slideOpacityAt } from './timeline';
	import { elementLayout } from './layout';
	import { defaultBorderColor, type ColorScheme, type SlideDefinition } from './types';
	import { resolveSlideColor } from './colors';
	import DataList from './DataList.svelte';
	import Repeater from './Repeater.svelte';
	import { boundText } from './repeater';
	import type { DataRow } from './types';
	import { slideTiming } from './timeline';
	import type { SlideData } from './types';
	let {
		definition,
		timeMs = 0,
		assetBase,
		assetUrls = {},
		viewportWidth,
		viewportHeight,
		animateTransitions = false,
		durationMs = definition.durationMs,
		includeExit = true,
		scheme = 'dark',
		data = {},
		label = 'Slide preview',
		row,
		rowIndex = 0,
		timeZone = 'America/New_York',
		dataTimeMs
	}: {
		definition: SlideDefinition;
		timeMs?: number;
		assetBase: string;
		assetUrls?: Record<string, string>;
		viewportWidth?: number;
		viewportHeight?: number;
		animateTransitions?: boolean;
		durationMs?: number;
		includeExit?: boolean;
		scheme?: ColorScheme;
		data?: SlideData;
		label?: string;
		row?: DataRow;
		rowIndex?: number;
		timeZone?: string;
		dataTimeMs?: number;
	} = $props();
	const repeaterClock = $derived(dataTimeMs ?? timeMs);
	let containerWidth = $state(0);
	const elementTimeMs = $derived(
		animateTransitions ? slideContentTime(definition, timeMs, durationMs) : timeMs
	);
	let containerHeight = $state(0);
	const renderWidth = $derived(viewportWidth ?? (containerWidth || definition.width));
	const renderHeight = $derived(viewportHeight ?? (containerHeight || definition.height));
	const scale = $derived(
		viewportWidth !== undefined && viewportHeight !== undefined
			? Math.min(
					containerWidth / Math.max(1, renderWidth),
					containerHeight / Math.max(1, renderHeight)
				)
			: 1
	);
</script>

<div
	class="relative h-full w-full overflow-hidden"
	style={`background:${resolveSlideColor(definition.background, scheme)};opacity:${animateTransitions ? slideOpacityAt(definition, timeMs, durationMs, includeExit) : 1};`}
	role="img"
	aria-label={label}
	bind:clientWidth={containerWidth}
	bind:clientHeight={containerHeight}
>
	<Div
		style={`position:absolute;left:50%;top:50%;width:${renderWidth}px;height:${renderHeight}px;transform:translate(-50%,-50%) scale(${scale});transform-origin:center;overflow:hidden;`}
	>
		{#each definition.elements as element (element.id)}
			{@const pose = poseAt(element, elementTimeMs)}
			{@const box = elementLayout(definition, element, pose, renderWidth, renderHeight)}
			<Div
				data-slide-element={element.id}
				style={`position:absolute;left:0;top:0;width:${box.width}px;height:${box.height}px;opacity:${pose.opacity};transform:translate(${box.x}px,${box.y}px) rotate(${pose.rotation}deg) scale(${pose.scale});transform-origin:center;overflow:hidden;color:${resolveSlideColor(element.color, scheme)};font-size:${box.fontSize}px;font-family:${element.fontFamily};${element.borderRadius !== undefined || element.type === 'ellipse' ? `border-radius:${element.type === 'ellipse' ? '50%' : `${((element.borderRadius ?? 0) * box.width) / element.width}px`};` : ''}${element.backgroundColor !== undefined ? `background:${resolveSlideColor(element.backgroundColor, scheme)};` : ''}`}
			>
				{#if element.type === 'text'}
					<Div
						style={`display:grid;grid-template-columns:minmax(0,1fr);align-content:${element.verticalAlign === 'middle' ? 'center' : element.verticalAlign === 'bottom' ? 'end' : 'start'};width:100%;height:100%;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.2;color:${resolveSlideColor(element.color, scheme)};font-size:${box.fontSize}px;font-family:${element.fontFamily};text-align:${element.align};font-weight:${element.fontWeight ?? 400};box-sizing:border-box;padding:${((element.padding ?? 0) * box.fontSize) / element.fontSize}px;`}
						>{element.binding
							? boundText(element.binding, row, rowIndex, timeZone)
							: element.text}</Div
					>
				{:else if element.type === 'list' && element.repeater}
					<Repeater
						settings={element.repeater}
						result={Object.hasOwn(data, element.id) ? data[element.id] : undefined}
						width={box.width}
						height={box.height}
						timeMs={animateTransitions
							? Math.max(
									0,
									(includeExit
										? Math.min(
												repeaterClock,
												slideTiming(definition, durationMs).entranceMs + durationMs
											)
										: repeaterClock) - slideTiming(definition, durationMs).entranceMs
								)
							: repeaterClock}
						{durationMs}
						{scheme}
						{assetBase}
						{assetUrls}
						timeZone={element.dataSource?.timeZone ?? timeZone}
						unit={box.fontSize / element.fontSize}
					/>
				{:else if element.type === 'list'}
					<DataList
						heading={element.text}
						result={Object.hasOwn(data, element.id) ? data[element.id] : undefined}
						width={box.width}
						height={box.height}
						fontSize={box.fontSize}
						fontFamily={element.fontFamily}
						color={resolveSlideColor(element.color, scheme)}
						align={element.align}
					/>
				{:else if element.type === 'image' || element.type === 'svg'}
					{#if element.assetId}<img
							src={assetUrls[element.assetId] ?? `${assetBase}/${element.assetId}`}
							alt={element.text}
							style={`width:100%;height:100%;object-fit:${element.fit};`}
						/>{/if}
				{:else}
					<Div
						style={`width:100%;height:100%;background:${resolveSlideColor(element.color, scheme)};border-radius:${element.type === 'ellipse' ? '50%' : `${((element.borderRadius ?? 0) * box.width) / element.width}px`};`}
					></Div>
				{/if}
				{#if (element.borderWidth ?? 0) > 0}
					<Div
						aria-hidden="true"
						style={`position:absolute;inset:0;pointer-events:none;box-sizing:border-box;border:${Math.min(((element.borderWidth ?? 0) * box.fontSize) / element.fontSize, Math.min(box.width, box.height) / 2)}px ${element.borderStyle ?? 'solid'} ${resolveSlideColor(element.borderColor ?? defaultBorderColor, scheme)};border-radius:inherit;`}
					></Div>
				{/if}
			</Div>
		{/each}
	</Div>
</div>
