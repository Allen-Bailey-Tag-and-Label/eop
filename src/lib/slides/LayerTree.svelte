<script lang="ts">
	import { Button, Div } from '$lib/components';
	import { GripVertical, ChevronDown, ChevronRight } from '@lucide/svelte';
	import LayerTree from './LayerTree.svelte';
	import type { SlideElement } from './types';
	import { framePathStartsWith } from './frames';
	let {
		elements,
		path = [],
		selectedPath,
		selectedId,
		onSelect,
		onReorder,
		onMove,
		drag = $bindable(null)
	}: {
		elements: SlideElement[];
		path?: string[];
		selectedPath: string[];
		selectedId: string;
		onSelect: (id: string, path: string[], inspect?: boolean) => void;
		onReorder: (path: string[], id: string, target: string, after: boolean) => void;
		onMove: (
			sourcePath: string[],
			id: string,
			destinationPath: string[],
			targetId?: string,
			after?: boolean
		) => void;
		drag?: { id: string; path: string[] } | null;
	} = $props();
	let collapsed = $state<string[]>([]);
	let target = $state<{ id: string; after: boolean; inside: boolean } | null>(null);
	const layers = $derived([...elements].reverse());
	const same = (a: string[], b: string[]) => JSON.stringify(a) === JSON.stringify(b);
	$effect(() => {
		if (!drag) target = null;
	});
	function destination(event: DragEvent, element: SlideElement) {
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		return {
			id: element.id,
			after: event.clientY >= rect.top + rect.height / 2,
			inside: Boolean(
				element.frame &&
					event.clientY > rect.top + rect.height / 4 &&
					event.clientY < rect.top + (rect.height * 3) / 4
			)
		};
	}
	function hover(event: DragEvent, element: SlideElement) {
		if (!drag) return;
		const next = destination(event, element),
			destinationPath = next.inside ? [...path, element.id] : path;
		if (framePathStartsWith(destinationPath, [...drag.path, drag.id])) {
			target = null;
			if (event.dataTransfer) event.dataTransfer.dropEffect = 'none';
			return;
		}
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
		target = next;
	}
	function canNest(id: string) {
		return drag && !framePathStartsWith([...path, id], [...drag.path, drag.id]);
	}
</script>

<Div class="min-w-0 space-y-1">
	{#each layers as element, index (element.id)}
		<Div class="flex min-w-0 items-center gap-1">
			{#if element.frame}<Button
					variants={['ghost']}
					class="h-6 w-5 shrink-0 p-0"
					aria-label={`Toggle frame ${element.text}`}
					aria-expanded={!collapsed.includes(element.id)}
					onclick={() =>
						(collapsed = collapsed.includes(element.id)
							? collapsed.filter((id) => id !== element.id)
							: [...collapsed, element.id])}
				>
					{#if collapsed.includes(element.id)}<ChevronRight size={12} />{:else}<ChevronDown
							size={12}
						/>{/if}
				</Button>{/if}
			<Button
				draggable="true"
				data-layer-selection={element.id}
				aria-label={`Layer ${index + 1}: ${element.type}: ${element.text.slice(0, 32)}`}
				aria-pressed={selectedId === element.id && same(path, selectedPath)}
				title={element.frame
					? 'Drop in the center to move inside this frame; drop at an edge to reorder'
					: 'Drag between layers to reorder or move between frames; Alt+Up/Down moves one layer'}
				variants={selectedId === element.id && same(path, selectedPath) ? [] : ['ghost']}
				class={`flex w-full min-w-0 cursor-grab items-center justify-start gap-1.5 rounded border-y-2 border-transparent px-2 py-1 text-left text-xs active:cursor-grabbing ${drag?.id === element.id && same(path, drag.path) ? 'opacity-50' : ''} ${drag && target?.id === element.id && !(drag.id === element.id && same(path, drag.path)) ? (target.inside ? 'bg-sky-100 ring-2 ring-sky-500 dark:bg-sky-950' : target.after ? 'border-b-sky-500' : 'border-t-sky-500') : ''}`}
				onclick={() => onSelect(element.id, path)}
				ondragstart={(event) => {
					event.stopPropagation();
					drag = { id: element.id, path: [...path] };
					target = null;
					if (event.dataTransfer) {
						event.dataTransfer.effectAllowed = 'move';
						event.dataTransfer.setData('text/plain', element.id);
					}
				}}
				ondragover={(event) => hover(event, element)}
				ondrop={(event) => {
					if (!drag) return;
					event.preventDefault();
					event.stopPropagation();
					const next = destination(event, element);
					if (next.inside) {
						onMove(drag.path, drag.id, [...path, element.id]);
						collapsed = collapsed.filter((id) => id !== element.id);
					} else if (same(path, drag.path)) onReorder(path, drag.id, element.id, next.after);
					else onMove(drag.path, drag.id, path, element.id, next.after);
					drag = null;
				}}
				ondragend={() => (drag = null)}
				onkeydown={(event) => {
					if (!event.altKey || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
					event.preventDefault();
					const next = index + (event.key === 'ArrowUp' ? -1 : 1);
					if (next >= 0 && next < layers.length)
						onReorder(path, element.id, layers[next].id, event.key === 'ArrowDown');
				}}
				><GripVertical size={13} aria-hidden="true" class="shrink-0 opacity-50" /><span
					class="min-w-0 truncate">{index + 1}. {element.type}: {element.text.slice(0, 32)}</span
				></Button
			>
		</Div>
		{#if element.frame && !collapsed.includes(element.id)}<Div
				class="ml-3 border-l border-current/15 pl-2"
			>
				<LayerTree
					elements={element.frame.elements}
					path={[...path, element.id]}
					{selectedPath}
					{selectedId}
					{onSelect}
					{onReorder}
					{onMove}
					bind:drag
				/>
				{#if !element.frame.elements.length || (drag && canNest(element.id))}
					<Button
						variants={['ghost']}
						aria-label={`Move dragged layer into frame ${element.text}`}
						class={`my-1 min-h-9 w-full border border-dashed border-slate-400 px-2 py-2 text-xs dark:border-gray-500 ${target?.id === element.id && target.inside ? 'bg-sky-100 ring-2 ring-sky-500 dark:bg-sky-950' : ''}`}
						ondragover={(event) => {
							event.stopPropagation();
							if (!canNest(element.id)) return;
							event.preventDefault();
							if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
							target = { id: element.id, inside: true, after: false };
						}}
						ondragleave={() => (target = null)}
						ondrop={(event) => {
							event.stopPropagation();
							if (!drag || !canNest(element.id)) return;
							event.preventDefault();
							onMove(drag.path, drag.id, [...path, element.id]);
							drag = null;
						}}>Drop layers into frame</Button
					>
				{/if}
			</Div>{/if}
	{/each}
</Div>
