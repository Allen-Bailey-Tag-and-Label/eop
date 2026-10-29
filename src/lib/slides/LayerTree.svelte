<script lang="ts">
	import { Button, Div } from '$lib/components';
	import { GripVertical, ChevronDown, ChevronRight } from '@lucide/svelte';
	import LayerTree from './LayerTree.svelte';
	import type { SlideElement } from './types';
	let {
		elements,
		path = [],
		selectedPath,
		selectedId,
		onSelect,
		onReorder,
		drag = $bindable(null)
	}: {
		elements: SlideElement[];
		path?: string[];
		selectedPath: string[];
		selectedId: string;
		onSelect: (id: string, path: string[]) => void;
		onReorder: (path: string[], id: string, target: string, after: boolean) => void;
		drag?: { id: string; path: string[] } | null;
	} = $props();
	let collapsed = $state<string[]>([]);
	let target = $state<{ id: string; after: boolean } | null>(null);
	const layers = $derived([...elements].reverse());
	const same = (a: string[], b: string[]) => JSON.stringify(a) === JSON.stringify(b);
	$effect(() => {
		if (!drag) target = null;
	});
	function hover(event: DragEvent, id: string) {
		if (!drag || !same(path, drag.path)) return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		target = { id, after: event.clientY >= rect.top + rect.height / 2 };
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
				aria-label={`Layer ${index + 1}: ${element.type}: ${element.text.slice(0, 32)}`}
				aria-pressed={selectedId === element.id && same(path, selectedPath)}
				title="Drag to reorder within this frame; Alt+Up/Down moves one layer"
				variants={selectedId === element.id && same(path, selectedPath) ? [] : ['ghost']}
				class={`flex w-full min-w-0 cursor-grab items-center justify-start gap-1.5 rounded border-y-2 border-transparent px-2 py-1 text-left text-xs active:cursor-grabbing ${drag?.id === element.id && same(path, drag.path) ? 'opacity-50' : ''} ${drag && same(path, drag.path) && target?.id === element.id && drag.id !== element.id ? (target.after ? 'border-b-sky-500' : 'border-t-sky-500') : ''}`}
				onclick={() => onSelect(element.id, path)}
				ondragstart={(event) => {
					drag = { id: element.id, path };
					target = null;
					onSelect(element.id, path);
					if (event.dataTransfer) {
						event.dataTransfer.effectAllowed = 'move';
						event.dataTransfer.setData('text/plain', element.id);
					}
				}}
				ondragover={(event) => hover(event, element.id)}
				ondrop={(event) => {
					if (!drag || !same(path, drag.path)) return;
					event.preventDefault();
					event.stopPropagation();
					const rect = event.currentTarget.getBoundingClientRect();
					onReorder(path, drag.id, element.id, event.clientY >= rect.top + rect.height / 2);
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
					bind:drag
				/>
			</Div>{/if}
	{/each}
</Div>
