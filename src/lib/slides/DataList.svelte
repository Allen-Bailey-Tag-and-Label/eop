<script lang="ts">
	import { Div } from '$lib/components';
	import type { DataListResult } from './types';
	let {
		heading,
		result,
		width,
		height,
		fontSize,
		fontFamily,
		color,
		align
	}: {
		heading: string;
		result?: DataListResult;
		width: number;
		height: number;
		fontSize: number;
		fontFamily: string;
		color: string;
		align: string;
	} = $props();
	const items = $derived(result?.items ?? []);
	const count = $derived(Math.max(1, items.length));
	const size = $derived(Math.max(1, Math.min(fontSize, (height / (count + 2)) * 0.7, width / 12)));
</script>

<Div
	style={`display:flex;flex-direction:column;gap:0.5em;width:100%;height:100%;min-height:0;color:${color};font-size:${size}px;font-family:${fontFamily};line-height:1.35;text-align:${align};`}
>
	{#if heading}<Div class="truncate font-semibold" title={heading}>{heading}</Div>{/if}
	{#if result?.state === 'ready' && items.length}
		<Div
			style={`display:grid;grid-template-rows:repeat(${items.length},minmax(0,1fr));flex:1;min-height:0;`}
		>
			{#each items as item (item.id)}
				<Div class="flex min-w-0 items-center justify-between gap-4">
					<span class="min-w-0 truncate" title={item.label}>{item.label}</span>
					<span class="shrink-0 whitespace-nowrap">{item.detail}</span>
				</Div>
			{/each}
		</Div>
	{:else}
		<Div class="flex min-h-0 flex-1 items-center justify-center"
			>{result?.message ?? 'Loading data…'}</Div
		>
	{/if}
</Div>
