<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	type Props = { children?: Snippet; class?: string, style?: string; };
	let { children, class: className, style, ...restProps }: Props = $props();
</script>

<label class={twMerge('font-semibold', className)} {style} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</label>
