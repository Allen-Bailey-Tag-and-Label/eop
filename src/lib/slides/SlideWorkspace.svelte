<script lang="ts">
	import { untrack } from 'svelte';
	import { Button, Div } from '$lib/components';
	import SlideCanvas from './SlideCanvas.svelte';
	import { poseAt } from './timeline';
	import { moveElement, resizeDimensions, resizeDelta, resizeElement } from './editor';
	import { elementLayout, type LayoutScales } from './layout';
	import type { SlideDefinition, SlideElement } from './types';
	let {
		definition = $bindable(),
		selectedId = $bindable(''),
		timeMs,
		animateTransitions = false,
		tool,
		zoom,
		resetView,
		viewportWidth,
		viewportHeight,
		onEdit
	}: {
		definition: SlideDefinition;
		selectedId?: string;
		timeMs: number;
		animateTransitions?: boolean;
		tool: 'select' | 'pan' | 'resize';
		zoom: number;
		resetView: number;
		viewportWidth: number;
		viewportHeight: number;
		onEdit: () => void;
	} = $props();
	let workspace: HTMLDivElement;
	let width = $state(0);
	let height = $state(0);
	let panX = $state(0);
	let panY = $state(0);
	let dragging = $state(false);
	const scale = $derived(
		Math.max(
			0.01,
			Math.min(
				Math.max(1, width - 64) / Math.max(1, viewportWidth),
				Math.max(1, height - 64) / Math.max(1, viewportHeight)
			)
		) * zoom
	);
	let gesture:
		| {
				pointerId: number;
				kind: 'pan' | 'move' | 'resize';
				x: number;
				y: number;
				startPanX: number;
				startPanY: number;
				element?: SlideElement;
				width: number;
				height: number;
				rotation: number;
				scale: number;
				layout: LayoutScales;
		  }
		| undefined;
	$effect(() => {
		if (resetView >= 0)
			untrack(() => {
				panX = 0;
				panY = 0;
			});
	});
	function start(event: PointerEvent, element?: SlideElement, resize = false) {
		if (event.button !== 0) return;
		if (tool !== 'pan' && !element) {
			selectedId = '';
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		if (element) selectedId = element.id;
		onEdit();
		const pose = element ? poseAt(element, timeMs) : null;
		const layout =
			element && pose
				? elementLayout(definition, element, pose, viewportWidth, viewportHeight)
				: { positionScaleX: 1, positionScaleY: 1, sizeScaleX: 1, sizeScaleY: 1 };
		gesture = {
			pointerId: event.pointerId,
			kind: tool === 'pan' ? 'pan' : resize ? 'resize' : 'move',
			x: event.clientX,
			y: event.clientY,
			startPanX: panX,
			startPanY: panY,
			element,
			width: element?.width ?? 0,
			height: element?.height ?? 0,
			rotation: pose?.rotation ?? 0,
			scale: pose?.scale ?? 1,
			layout
		};
		dragging = true;
		workspace.setPointerCapture(event.pointerId);
	}
	function drag(event: PointerEvent) {
		if (!gesture || event.pointerId !== gesture.pointerId) return;
		const dx = event.clientX - gesture.x;
		const dy = event.clientY - gesture.y;
		if (gesture.kind === 'pan') {
			panX = gesture.startPanX + dx;
			panY = gesture.startPanY + dy;
		} else if (gesture.element && gesture.kind === 'move') {
			moveElement(
				gesture.element,
				dx / scale / Math.max(0.0001, gesture.layout.positionScaleX),
				dy / scale / Math.max(0.0001, gesture.layout.positionScaleY)
			);
			gesture.x = event.clientX;
			gesture.y = event.clientY;
		} else if (gesture.element) {
			const delta = resizeDelta(dx / scale, dy / scale, gesture.rotation, gesture.scale);
			resizeElement(
				gesture.element,
				{
					width: Math.max(
						1,
						Math.min(
							8192,
							gesture.width + delta.width / Math.max(0.0001, gesture.layout.sizeScaleX)
						)
					),
					height: Math.max(
						1,
						Math.min(
							8192,
							gesture.height + delta.height / Math.max(0.0001, gesture.layout.sizeScaleY)
						)
					)
				},
				gesture.rotation,
				gesture.scale,
				gesture.layout
			);
		}
	}
	function stop(event: PointerEvent) {
		if (gesture?.pointerId !== event.pointerId) return;
		if (workspace.hasPointerCapture(event.pointerId))
			workspace.releasePointerCapture(event.pointerId);
		gesture = undefined;
		dragging = false;
	}
	function nudge(event: KeyboardEvent, element: SlideElement) {
		const vectors: Record<string, [number, number]> = {
			ArrowLeft: [-1, 0],
			ArrowRight: [1, 0],
			ArrowUp: [0, -1],
			ArrowDown: [0, 1]
		};
		const vector = vectors[event.key];
		if (!vector) return;
		event.preventDefault();
		if (tool === 'pan') {
			panX += vector[0] * 10;
			panY += vector[1] * 10;
			return;
		}
		onEdit();
		moveElement(
			element,
			vector[0] * (event.shiftKey ? 10 : 1),
			vector[1] * (event.shiftKey ? 10 : 1)
		);
	}
	function keyboardResize(event: KeyboardEvent, element: SlideElement) {
		const vectors: Record<string, [number, number]> = {
			ArrowLeft: [-1, 0],
			ArrowRight: [1, 0],
			ArrowUp: [0, -1],
			ArrowDown: [0, 1]
		};
		const vector = vectors[event.key];
		if (!vector) return;
		event.preventDefault();
		onEdit();
		const step = event.shiftKey ? 10 : 1;
		const pose = poseAt(element, timeMs);
		resizeElement(
			element,
			resizeDimensions(element.width, element.height, vector[0] * step, vector[1] * step, 0, 1),
			pose.rotation,
			pose.scale,
			elementLayout(definition, element, pose, viewportWidth, viewportHeight)
		);
	}
</script>

<div
	bind:this={workspace}
	bind:clientWidth={width}
	bind:clientHeight={height}
	class="relative h-full min-h-0 w-full min-w-0 touch-none overflow-hidden bg-slate-200 dark:bg-gray-950"
	style={`cursor:${tool === 'pan' ? (dragging ? 'grabbing' : 'grab') : 'default'};background-image:radial-gradient(#64748b33 1px,transparent 1px);background-size:16px 16px;`}
	role="application"
	aria-label="Slide workspace"
	onpointerdown={(event) => start(event)}
	onpointermove={drag}
	onpointerup={stop}
	onpointercancel={stop}
>
	<Div
		class="absolute bg-black shadow-xl [--slide-checker-a:#e5e7eb] [--slide-checker-b:#f3f4f6] dark:[--slide-checker-a:#1f2937] dark:[--slide-checker-b:#374151]"
		style={`left:50%;top:50%;width:${viewportWidth * scale}px;height:${viewportHeight * scale}px;transform:translate(calc(-50% + ${panX}px),calc(-50% + ${panY}px));${definition.background === 'transparent' ? 'background:repeating-conic-gradient(var(--slide-checker-a) 0% 25%,var(--slide-checker-b) 0% 50%) 0 0 / 20px 20px;' : ''}`}
	>
		<SlideCanvas
			{definition}
			{timeMs}
			{animateTransitions}
			{viewportWidth}
			{viewportHeight}
			assetBase="/admin/monitors/slides/assets"
		/>
		<Div class="pointer-events-none absolute inset-0 overflow-visible">
			{#each definition.elements as element, index (element.id)}
				{@const pose = poseAt(element, timeMs)}
				{@const box = elementLayout(definition, element, pose, viewportWidth, viewportHeight)}
				<Div
					class="absolute"
					style={`left:0;top:0;width:${box.width * scale}px;height:${box.height * scale}px;transform:translate(${box.x * scale}px,${box.y * scale}px) rotate(${pose.rotation}deg) scale(${Math.max(pose.scale, 0.01)});transform-origin:center;`}
				>
					<Button
						aria-label={`Select element ${index + 1}: ${element.type}`}
						aria-pressed={selectedId === element.id}
						variants={['ghost']}
						class={`absolute inset-0 h-full w-full rounded-none border-2 p-0 shadow-none backdrop-blur-none hover:border-sky-400 ${tool === 'pan' ? 'pointer-events-none' : 'pointer-events-auto'} ${selectedId === element.id ? 'border-sky-500' : 'border-transparent'}`}
						onclick={() => (selectedId = element.id)}
						onpointerdown={(event) => start(event, element)}
						onkeydown={(event) => nudge(event, element)}
					/>
					{#if selectedId === element.id && tool === 'resize'}
						<Button
							aria-label="Resize selected element"
							variants={['ghost']}
							class="pointer-events-auto absolute -right-2 -bottom-2 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-white bg-sky-500 p-0 shadow-none"
							onpointerdown={(event) => start(event, element, true)}
							onkeydown={(event) => keyboardResize(event, element)}
						/>
					{/if}
				</Div>
			{/each}
		</Div>
	</Div>
</div>
