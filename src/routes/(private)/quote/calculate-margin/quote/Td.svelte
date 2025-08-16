<script lang="ts">
	import { Td } from '$lib/components';
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	type Props = {
		children: Snippet;
		class?: string;
	};

	let { children, class: className }: Props = $props();
</script>

<Td class={twMerge('px-2 py-1', className)}>
	{@render children()}
</Td>
