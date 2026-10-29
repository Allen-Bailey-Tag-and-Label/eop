<script lang="ts">
	import { untrack, tick } from 'svelte';
	import { Button, Div } from '$lib/components';
	import { RotateCw } from '@lucide/svelte';
	import SlideCanvas from './SlideCanvas.svelte';
	import { poseAt } from './timeline';
	import { displayBackground, hasColorTransparency, resolveSlideColor } from './colors';
	import {
		moveElement,
		resizeHandles,
		type ResizeHandle,
		resizeDelta,
		resizeElement,
		rotateElement,
		rotationDelta
	} from './editor';
	import { elementLayout, type LayoutScales } from './layout';
	import type { DataRow, ColorScheme, SlideData, SlideDefinition, SlideElement } from './types';
	import type { FrameDefinition } from './types';
	let {
		definition = $bindable(),
		selectedId = $bindable(''),
		timeMs,
		scheme = 'dark',
		data = {},
		tool,
		zoom,
		resetView,
		viewportWidth,
		viewportHeight,
		onEdit,
		row,
		rowIndex = 0,
		timeZone = 'America/New_York',
		flow
	}: {
		definition: SlideDefinition;
		selectedId?: string;
		timeMs: number;
		scheme?: ColorScheme;
		data?: SlideData;
		tool: 'select' | 'pan' | 'resize';
		zoom: number;
		resetView: number;
		viewportWidth: number;
		viewportHeight: number;
		onEdit: () => void;
		row?: DataRow;
		rowIndex?: number;
		timeZone?: string;
		flow?: FrameDefinition;
	} = $props();
	let workspace: HTMLDivElement;
	let flowBoxes = $state<Record<string, { x: number; y: number; width: number; height: number }>>(
		{}
	);
	$effect(() => {
		if (!flow || flow.layout === 'free') {
			flowBoxes = {};
			return;
		}
		JSON.stringify(definition);
		void scale;
		void timeMs;
		void tick().then(() => {
			const root = workspace?.querySelector('[data-canvas-root]');
			if (!root) return;
			flowBoxes = Object.fromEntries(
				Array.from(root.children)
					.filter((node) => node.hasAttribute('data-slide-element'))
					.map((node) => {
						const item = node as HTMLElement;
						return [
							node.getAttribute('data-slide-element')!,
							{
								x: item.offsetLeft,
								y: item.offsetTop,
								width: item.clientWidth,
								height: item.clientHeight
							}
						];
					})
			);
		});
	});
	const elementTimeMs = $derived(timeMs);
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
				kind: 'pan' | 'move' | 'resize' | 'rotate';
				handle: ResizeHandle;
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
				centerX: number;
				centerY: number;
				angle: number;
				angleDelta: number;
		  }
		| undefined;
	$effect(() => {
		if (resetView >= 0)
			untrack(() => {
				panX = 0;
				panY = 0;
			});
	});
	function fixFlowSize(element: SlideElement, layout: LayoutScales) {
		if (!flow || flow.layout === 'free') return;
		const root = workspace.querySelector('[data-canvas-root]');
		const node = Array.from(root?.children ?? []).find(
			(node) => node.getAttribute('data-slide-element') === element.id
		) as HTMLElement | undefined;
		if (node?.clientWidth && node?.clientHeight) {
			element.width = Math.max(
				1,
				Math.min(8192, node.clientWidth / Math.max(0.0001, layout.sizeScaleX))
			);
			element.height = Math.max(
				1,
				Math.min(8192, node.clientHeight / Math.max(0.0001, layout.sizeScaleY))
			);
		}
		element.layoutSizing = 'fixed';
	}
	function start(
		event: PointerEvent,
		element?: SlideElement,
		mode: 'move' | 'resize' | 'rotate' = 'move',
		handle: ResizeHandle = { x: 1, y: 1 }
	) {
		if (event.button !== 0) return;
		if (tool !== 'pan' && !element) {
			selectedId = '';
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		if (element) selectedId = element.id;
		onEdit();
		if (flow && flow.layout !== 'free' && mode === 'move' && tool !== 'pan') return;
		const pose = element ? poseAt(element, elementTimeMs) : null;
		const layout =
			element && pose
				? elementLayout(definition, element, pose, viewportWidth, viewportHeight)
				: { positionScaleX: 1, positionScaleY: 1, sizeScaleX: 1, sizeScaleY: 1 };
		const bounds = (event.currentTarget as HTMLElement)
			.closest('[data-element-overlay]')
			?.getBoundingClientRect();
		if (element && mode === 'resize') fixFlowSize(element, layout);
		const centerX = bounds ? bounds.left + bounds.width / 2 : 0;
		const centerY = bounds ? bounds.top + bounds.height / 2 : 0;
		gesture = {
			pointerId: event.pointerId,
			handle,
			kind: tool === 'pan' ? 'pan' : mode,
			x: event.clientX,
			y: event.clientY,
			startPanX: panX,
			startPanY: panY,
			element,
			width: element?.width ?? 0,
			height: element?.height ?? 0,
			rotation: pose?.rotation ?? 0,
			scale: pose?.scale ?? 1,
			layout,
			centerX,
			centerY,
			angle: (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI,
			angleDelta: 0
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
		} else if (gesture.element && gesture.kind === 'rotate') {
			const angle =
				(Math.atan2(event.clientY - gesture.centerY, event.clientX - gesture.centerX) * 180) /
				Math.PI;
			gesture.angleDelta += rotationDelta(gesture.angle, angle);
			gesture.angle = angle;
			const desired = gesture.rotation + gesture.angleDelta;
			const target = event.shiftKey ? Math.round(desired / 15) * 15 : desired;
			rotateElement(gesture.element, target - poseAt(gesture.element, elementTimeMs).rotation);
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
							gesture.width +
								(delta.width * gesture.handle.x) / Math.max(0.0001, gesture.layout.sizeScaleX)
						)
					),
					height: Math.max(
						1,
						Math.min(
							8192,
							gesture.height +
								(delta.height * gesture.handle.y) / Math.max(0.0001, gesture.layout.sizeScaleY)
						)
					)
				},
				gesture.rotation,
				gesture.scale,
				gesture.layout,
				gesture.handle
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
		if (flow && flow.layout !== 'free' && tool !== 'pan') return;
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
	function keyboardResize(event: KeyboardEvent, element: SlideElement, handle: ResizeHandle) {
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
		const pose = poseAt(element, elementTimeMs);
		fixFlowSize(element, elementLayout(definition, element, pose, viewportWidth, viewportHeight));
		resizeElement(
			element,
			{
				width: Math.max(1, Math.min(8192, element.width + vector[0] * step * handle.x)),
				height: Math.max(1, Math.min(8192, element.height + vector[1] * step * handle.y))
			},
			pose.rotation,
			pose.scale,
			elementLayout(definition, element, pose, viewportWidth, viewportHeight),
			handle
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
		class="absolute shadow-xl"
		style={`left:50%;top:50%;width:${viewportWidth * scale}px;height:${viewportHeight * scale}px;transform:translate(calc(-50% + ${panX}px),calc(-50% + ${panY}px));background:${hasColorTransparency(resolveSlideColor(definition.background, scheme)) ? `repeating-conic-gradient(${scheme === 'dark' ? '#1f2937 0% 25%,#374151' : '#e5e7eb 0% 25%,#f3f4f6'} 0% 50%) 0 0 / 20px 20px` : displayBackground(scheme)};`}
	>
		<SlideCanvas
			{flow}
			clip={flow?.clip ?? true}
			{definition}
			{timeMs}
			{scheme}
			{data}
			{row}
			{rowIndex}
			{timeZone}
			{viewportWidth}
			{viewportHeight}
			assetBase="/admin/monitors/slides/assets"
		/>
		<Div class="pointer-events-none absolute inset-0 overflow-visible">
			{#each definition.elements as element, index (element.id)}
				{@const pose = poseAt(element, elementTimeMs)}
				{@const box = elementLayout(definition, element, pose, viewportWidth, viewportHeight)}
				{@const flowBox = flow && flow.layout !== 'free' ? flowBoxes[element.id] : undefined}
				<Div
					class="absolute"
					data-element-overlay={element.id}
					style={flowBox
						? `left:0;top:0;width:${flowBox.width * scale}px;height:${flowBox.height * scale}px;transform:translate(${(flowBox.x + box.x - elementLayout(definition, element, element, viewportWidth, viewportHeight).x) * scale}px,${(flowBox.y + box.y - elementLayout(definition, element, element, viewportWidth, viewportHeight).y) * scale}px) rotate(${pose.rotation}deg) scale(${Math.max(pose.scale, 0.01)});transform-origin:center;`
						: `left:0;top:0;width:${box.width * scale}px;height:${box.height * scale}px;transform:translate(${box.x * scale}px,${box.y * scale}px) rotate(${pose.rotation}deg) scale(${Math.max(pose.scale, 0.01)});transform-origin:center;`}
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
					{#if selectedId === element.id && tool !== 'pan'}
						<Div
							class="pointer-events-none absolute -top-6 left-1/2 h-6 w-px bg-white ring-1 ring-slate-950"
						></Div>
						<Button
							aria-label="Rotate selected element"
							title="Drag to rotate; Shift snaps to 15 degrees. Arrow keys rotate."
							class="pointer-events-auto absolute -top-9 left-1/2 h-6 w-6 -translate-x-1/2 cursor-grab items-center rounded-full border-2 border-white bg-sky-500 p-0 text-white shadow-sm ring-1 shadow-black/50 ring-slate-950 backdrop-blur-none focus-visible:outline-offset-4 dark:border-white dark:bg-sky-500 dark:text-white dark:shadow-sm"
							onpointerdown={(event) => start(event, element, 'rotate')}
							onkeydown={(event) => {
								if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
								event.preventDefault();
								event.stopPropagation();
								onEdit();
								rotateElement(
									element,
									event.key === 'Home'
										? -poseAt(element, elementTimeMs).rotation
										: (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 15 : 1)
								);
							}}><RotateCw size={12} aria-hidden="true" /></Button
						>
					{/if}
					{#if selectedId === element.id && tool !== 'pan'}
						{#each resizeHandles as handle (handle.name)}
							<Button
								aria-label={`Resize selected element from ${handle.name}`}
								title={`Resize from ${handle.name}`}
								class="pointer-events-auto absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-white bg-sky-500 p-0 shadow-sm ring-1 shadow-black/50 ring-slate-950 backdrop-blur-none focus-visible:outline-offset-4 dark:border-white dark:bg-sky-500 dark:shadow-sm"
								style={`left:${(handle.x + 1) * 50}%;top:${(handle.y + 1) * 50}%;cursor:${handle.cursor};`}
								onpointerdown={(event) => start(event, element, 'resize', handle)}
								onkeydown={(event) => keyboardResize(event, element, handle)}
							/>
						{/each}
					{/if}
				</Div>
			{/each}
		</Div>
	</Div>
</div>
