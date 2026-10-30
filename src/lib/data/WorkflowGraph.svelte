<script lang="ts">
	import { Button, Card, P } from '$lib/components';
	import type { WorkflowNode } from './types';
	let { nodes, selected = $bindable('') }: { nodes: WorkflowNode[]; selected?: string } = $props();
	let dragging = $state<{
		id: string;
		x: number;
		y: number;
		originX: number;
		originY: number;
	} | null>(null);
	const layout = $derived.by(() => {
		const depth = (node: WorkflowNode, seen: string[] = []): number => {
			if (seen.includes(node.id)) return 0;
			seen = [...seen, node.id];
			return node.inputs.length
				? 1 +
						Math.max(
							...node.inputs.map((id) => {
								const input = nodes.find((item) => item.id === id);
								return input ? depth(input, seen) : 0;
							})
						)
				: 0;
		};
		return nodes.map((node, index) => ({
			node,
			x: node.position?.x ?? depth(node) * 230 + 20,
			y: node.position?.y ?? index * 90 + 20
		}));
	});
	const width = $derived(Math.max(700, ...layout.map((item) => item.x + 220)));
	const height = $derived(Math.max(300, ...layout.map((item) => item.y + 80)));
</script>

<P class="text-sm"
	>Drag nodes to arrange the graph. Click a node to choose its preview. Change input connections in
	the node's settings below.</P
>
<Card class="h-80 overflow-auto p-0" role="region" aria-label="Workflow graph">
	<div class="relative" style={`width:${width}px;height:${height}px;`}>
		<svg
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 text-gray-400 dark:text-gray-500"
			{width}
			{height}
		>
			{#each layout as item (item.node.id)}{#each item.node.inputs as id (id)}{@const input =
						layout.find((source) => source.node.id === id)}{#if input}<path
							d={`M ${input.x + 190} ${input.y + 28} C ${input.x + 215} ${input.y + 28}, ${item.x - 25} ${item.y + 28}, ${item.x} ${item.y + 28}`}
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						/>{/if}{/each}{/each}
		</svg>
		{#each layout as item (item.node.id)}
			<Button
				class="absolute h-14 w-48 touch-none flex-col items-start truncate text-left text-xs"
				style={`left:${item.x}px;top:${item.y}px;`}
				variants={selected === item.node.id ? [] : ['ghost']}
				aria-label={`Workflow node ${item.node.id}`}
				aria-pressed={selected === item.node.id}
				onclick={() => (selected = item.node.id)}
				onpointerdown={(event: PointerEvent & { currentTarget: HTMLButtonElement }) => {
					if (event.button !== 0) return;
					dragging = {
						id: item.node.id,
						x: event.clientX,
						y: event.clientY,
						originX: item.x,
						originY: item.y
					};
					event.currentTarget.setPointerCapture(event.pointerId);
				}}
				onpointermove={(event: PointerEvent) => {
					if (dragging?.id === item.node.id)
						item.node.position = {
							x: Math.max(0, Math.min(5000, dragging.originX + event.clientX - dragging.x)),
							y: Math.max(0, Math.min(5000, dragging.originY + event.clientY - dragging.y))
						};
				}}
				onpointerup={() => (dragging = null)}
				onpointercancel={() => (dragging = null)}
				><span class="font-semibold">{item.node.type}</span><span
					class="max-w-full truncate opacity-70">{item.node.id}</span
				></Button
			>
		{/each}
	</div>
</Card>
