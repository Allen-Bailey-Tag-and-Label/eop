<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	type Props = { children?: Snippet; class?: string };
	let { children, class: className, ...restProps }: Props = $props();
</script>

<label class={twMerge('font-semibold', className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</label>
