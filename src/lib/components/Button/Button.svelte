<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';

	type Props = {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		disabled?: boolean;
		isIcon?: boolean;
		isRounded?: boolean;
		style?: string;
		tabIndex?: string;
		theme?: 'default' | 'contrast' | 'error' | 'ghost' | 'secondary';
		type?: 'button' | 'submit';
	} & any;
	let {
		attachments = $bindable([]),
		children,
		class: className,
		disabled,
		isIcon,
		isRounded = true,
		style,
		tabIndex,
		theme = 'default',
		type = 'button',
		...restProps
	}: Props = $props();
</script>

<button
	{...restProps}
	{@attach attachmentFactory(attachments)}
	class={twMerge(
		'bg-primary-500 outline-primary-500/0 flex justify-center px-6 py-3 text-white outline-1 transition duration-200 hover:outline-gray-400 focus:outline-2 focus:outline-gray-950 dark:focus:outline-gray-50',
		theme === 'contrast'
			? 'focus:outline-primary-500 dark:focus:outline-primary-500 bg-gray-950 text-gray-50 dark:bg-gray-50 dark:text-gray-950'
			: undefined,
		theme === 'error' ? 'bg-red-500' : undefined,
		theme === 'ghost'
			? 'bg-gray-950/0 text-gray-950 hover:bg-gray-950/10 focus:bg-gray-950/10 dark:bg-gray-50/0 dark:text-gray-50 dark:hover:bg-gray-50/10 dark:focus:bg-gray-50/10'
			: undefined,
		theme === 'secondary' ? 'bg-secondary-500 outline-secondary-500/0' : undefined,
		disabled ? 'opacity-50' : undefined,
		isIcon ? 'aspect-square w-12 items-center justify-center p-0' : undefined,
		isRounded ? 'rounded-sm' : undefined,
		className
	)}
	{disabled}
	{style}
	{tabIndex}
	{type}
>
	{#if children}
		{@render children()}
	{/if}
</button>
