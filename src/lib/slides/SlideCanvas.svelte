<script lang="ts">
	import { Div } from '$lib/components';
	import { poseAt } from './timeline';
	import { elementLayout } from './layout';
	import type { SlideDefinition } from './types';
	let {
		definition,
		timeMs = 0,
		assetBase,
		assetUrls = {},
		viewportWidth,
		viewportHeight,
		label = 'Slide preview'
	}: {
		definition: SlideDefinition;
		timeMs?: number;
		assetBase: string;
		assetUrls?: Record<string, string>;
		viewportWidth?: number;
		viewportHeight?: number;
		label?: string;
	} = $props();
	let containerWidth = $state(0);
	let containerHeight = $state(0);
	const renderWidth = $derived(viewportWidth ?? containerWidth);
	const renderHeight = $derived(viewportHeight ?? containerHeight);
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
	style={`background:${definition.background};`}
	role="img"
	aria-label={label}
	bind:clientWidth={containerWidth}
	bind:clientHeight={containerHeight}
>
	<Div
		style={`position:absolute;left:50%;top:50%;width:${renderWidth}px;height:${renderHeight}px;transform:translate(-50%,-50%) scale(${scale});transform-origin:center;overflow:hidden;`}
	>
		{#each definition.elements as element (element.id)}
			{@const pose = poseAt(element, timeMs)}
			{@const box = elementLayout(definition, element, pose, renderWidth, renderHeight)}
			<Div
				style={`position:absolute;left:0;top:0;width:${box.width}px;height:${box.height}px;opacity:${pose.opacity};transform:translate(${box.x}px,${box.y}px) rotate(${pose.rotation}deg) scale(${pose.scale});transform-origin:center;overflow:hidden;`}
			>
				{#if element.type === 'text'}
					<Div
						style={`width:100%;height:100%;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.2;color:${element.color};font-size:${box.fontSize}px;font-family:${element.fontFamily};text-align:${element.align};`}
						>{element.text}</Div
					>
				{:else if element.type === 'image' || element.type === 'svg'}
					{#if element.assetId}<img
							src={assetUrls[element.assetId] ?? `${assetBase}/${element.assetId}`}
							alt={element.text}
							style={`width:100%;height:100%;object-fit:${element.fit};`}
						/>{/if}
				{:else}
					<Div
						style={`width:100%;height:100%;background:${element.color};border-radius:${element.type === 'ellipse' ? '50%' : '0'};`}
					></Div>
				{/if}
			</Div>
		{/each}
	</Div>
</div>
