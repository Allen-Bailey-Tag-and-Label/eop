<script lang="ts">
	import { Div } from '$lib/components';
	import { poseAt, slideContentTime, slideOpacityAt } from './timeline';
	import { elementLayout } from './layout';
	import { defaultBorderColor, type ColorScheme, type SlideDefinition } from './types';
	import { resolveSlideColor } from './colors';
	import DataList from './DataList.svelte';
	import Repeater from './Repeater.svelte';
	import QrCode from './QrCode.svelte';
	import FrameCanvas from './FrameCanvas.svelte';
	import { paddingSides, paddingCss } from './padding';
	import { frameLayoutStyle, elementPositionStyle } from './frames';
	import type { FrameDefinition } from './types';
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
		dataTimeMs,
		flow,
		clip = true
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
		flow?: FrameDefinition;
		clip?: boolean;
	} = $props();
	const repeaterClock = $derived(dataTimeMs ?? timeMs);
	// Remove the slide entrance once, before passing the data clock into nested frames.
	// Held slides keep paging after element keyframes reach their final pose.
	const repeaterTimeMs = $derived(
		animateTransitions
			? Math.max(
					0,
					(includeExit
						? Math.min(repeaterClock, slideTiming(definition, durationMs).entranceMs + durationMs)
						: repeaterClock) - slideTiming(definition, durationMs).entranceMs
				)
			: repeaterClock
	);
	let measured = $state<Record<string, { width: number; height: number }>>({});
	function observe(node: HTMLDivElement, id: string) {
		if (!flow || flow.layout === 'free') return;
		const update = () => {
			const width = node.clientWidth,
				height = node.clientHeight;
			if (
				width > 0 &&
				height > 0 &&
				(measured[id]?.width !== width || measured[id]?.height !== height)
			)
				measured[id] = { width, height };
		};
		const observer = new ResizeObserver(update);
		observer.observe(node);
		update();
		return () => observer.disconnect();
	}
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
	class={`relative h-full w-full ${clip ? 'overflow-hidden' : 'overflow-visible'}`}
	style={`background:${resolveSlideColor(definition.background, scheme)};opacity:${animateTransitions ? slideOpacityAt(definition, timeMs, durationMs, includeExit) : 1};`}
	role="img"
	aria-label={label}
	bind:clientWidth={containerWidth}
	bind:clientHeight={containerHeight}
>
	<Div
		data-canvas-root
		style={`position:absolute;left:50%;top:50%;width:${renderWidth}px;height:${renderHeight}px;transform:translate(-50%,-50%) scale(${scale});transform-origin:center;overflow:${clip ? 'hidden' : 'visible'};${frameLayoutStyle(flow, Math.min(renderWidth / definition.width, renderHeight / definition.height))}`}
	>
		{#each definition.elements as element, index (element.id)}
			{@const pose = poseAt(element, elementTimeMs)}
			{@const box = elementLayout(definition, element, pose, renderWidth, renderHeight)}
			{@const base = elementLayout(definition, element, element, renderWidth, renderHeight)}
			{@const unit = box.fontSize / element.fontSize}
			{@const p = paddingSides(element.padding)}
			{@const clipElement = (element.frame?.clip ?? element.repeater?.clip) !== false}
			{@const contentWidth = Math.max(
				1,
				(flow && flow.layout !== 'free' ? (measured[element.id]?.width ?? box.width) : box.width) -
					(p.left + p.right) * unit
			)}
			{@const contentHeight = Math.max(
				1,
				(flow && flow.layout !== 'free'
					? (measured[element.id]?.height ?? box.height)
					: box.height) -
					(p.top + p.bottom) * unit
			)}
			{#snippet content()}
				{#if element.type === 'frame'}
					<FrameCanvas
						{element}
						width={contentWidth}
						height={contentHeight}
						{durationMs}
						timeMs={elementTimeMs}
						dataTimeMs={repeaterTimeMs}
						{scheme}
						{data}
						{assetBase}
						{assetUrls}
						{row}
						{rowIndex}
						{timeZone}
					/>
				{:else if element.type === 'qr'}
					<QrCode
						value={element.binding
							? boundText(element.binding, row, rowIndex, timeZone)
							: element.text}
						foreground={resolveSlideColor(element.color, scheme)}
						background={resolveSlideColor(element.backgroundColor ?? '#ffffff', scheme)}
						correction={element.qrCorrection ?? 'M'}
					/>
				{:else if element.type === 'text'}
					<Div
						style={`display:grid;grid-template-columns:minmax(0,1fr);align-content:${element.verticalAlign === 'middle' ? 'center' : element.verticalAlign === 'bottom' ? 'end' : 'start'};width:100%;height:100%;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.2;color:${resolveSlideColor(element.color, scheme)};font-size:${box.fontSize}px;font-family:${element.fontFamily};text-align:${element.align};font-weight:${element.fontWeight ?? 400};box-sizing:border-box;padding:${paddingCss(element.padding, unit)};`}
						>{element.binding
							? boundText(element.binding, row, rowIndex, timeZone)
							: element.text}</Div
					>
				{:else if element.type === 'list' && element.repeater}
					<Repeater
						settings={element.repeater}
						result={Object.hasOwn(data, element.id) ? data[element.id] : undefined}
						width={contentWidth}
						height={contentHeight}
						timeMs={repeaterTimeMs}
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
						width={contentWidth}
						height={contentHeight}
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
			{/snippet}
			<Div
				{@attach (node) => observe(node, element.id)}
				data-slide-element={element.id}
				style={`${elementPositionStyle(element, box, base, flow)}order:${-index};z-index:${index};opacity:${pose.opacity};overflow:${clipElement ? 'hidden' : 'visible'};color:${resolveSlideColor(element.color, scheme)};font-size:${box.fontSize}px;font-family:${element.fontFamily};${element.borderRadius !== undefined || element.type === 'ellipse' ? `border-radius:${element.type === 'ellipse' ? '50%' : `${((element.borderRadius ?? 0) * box.width) / element.width}px`};` : ''}${element.backgroundColor !== undefined || element.frame ? `background:${resolveSlideColor(element.backgroundColor ?? element.color, scheme)};` : ''}`}
			>
				{#if element.type === 'text'}{@render content()}{:else}<Div
						style={`position:absolute;inset:${paddingCss(element.padding, unit)};`}
						>{@render content()}</Div
					>{/if}
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
