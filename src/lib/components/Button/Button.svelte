<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	type Props = {
		children?: Snippet;
		class?: string;
		isIcon?: boolean;
		theme?: 'default' | 'contrast' | 'ghost' | 'secondary';
		type?: 'button' | 'submit';
	} & any;
	let {
		children,
		class: className,
		isIcon,
		theme = 'default',
		type = 'button',
		...restProps
	}: Props = $props();
</script>

<button
	class={twMerge(
		'bg-primary-500 outline-primary-500/0 rounded-sm p-3 text-white outline-1 transition duration-200 hover:outline-gray-400 focus:outline-2 focus:outline-gray-950 dark:focus:outline-gray-50',
		theme === 'contrast'
			? 'focus:outline-primary-500 dark:focus:outline-primary-500 bg-gray-950 text-gray-50 dark:bg-gray-50 dark:text-gray-950'
			: undefined,
		theme === 'ghost'
			? 'bg-gray-950/0 text-gray-950 hover:bg-gray-950/10 focus:bg-gray-950/10 dark:bg-gray-50/0 dark:text-gray-50 dark:hover:bg-gray-50/10 dark:focus:bg-gray-50/10'
			: undefined,
		theme === 'secondary' ? 'bg-secondary-500 outline-secondary-500/0' : undefined,
		isIcon ? 'aspect-square w-12' : undefined,
		className
	)}
	{type}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</button>
