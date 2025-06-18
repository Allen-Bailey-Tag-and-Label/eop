<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	type Props = {
		children?: Snippet;
		class?: string;
		href?: string;
		tabIndex?: string;
		theme?: 'default' | 'button';
	} & any;
	let {
		children,
		class: className,
		href = '#',
		tabIndex,
		theme = 'default',
		...restProps
	}: Props = $props();
</script>

<a
	class={twMerge(
		'',
		theme === 'button'
			? 'bg-primary-500 outline-primary-500/0 px-6 py-3 text-white outline-1 transition duration-200 hover:outline-gray-400 focus:outline-2 focus:outline-gray-950 dark:focus:outline-gray-50'
			: undefined,
		className
	)}
	{href}
	{tabIndex}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</a>
