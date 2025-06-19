<script lang="ts">
	import { type Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	type Props = { children?: Snippet; class?: string; style?: string };
	let { children, class: className, style, ...restProps }: Props = $props();
</script>

<div
	class={twMerge(
		'rounded-sm bg-slate-50/30 p-6 backdrop-blur-md transition duration-200 dark:bg-slate-50/10',
		className
	)}
	{style}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
