<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = { children?: Snippet; class?: string };
	let { children, class: className, ...restProps }: Props = $props();
</script>

<div class={className} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</div>
