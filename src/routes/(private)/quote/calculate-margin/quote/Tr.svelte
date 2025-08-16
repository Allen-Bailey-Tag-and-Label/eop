<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Tr } from '$lib/components';
	import * as formats from '$lib/formats';
	import Td from './Td.svelte';

	type Props = {
		children: Snippet;
		label: string;
		percent?: number;
	};

	let { children, label, percent }: Props = $props();
</script>

<Tr class="even:bg-transparent dark:even:bg-transparent">
	<Td>{label}</Td>
	<Td>
		{@render children()}
	</Td>
	{#if percent}
		<Td class={percent < 0 ? 'bg-red-500 text-white' : undefined}>{formats.percent(percent)}</Td>
	{/if}
</Tr>
