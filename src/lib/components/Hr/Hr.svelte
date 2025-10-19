<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';
	import { theme } from '$lib/theme';

	type Props = Omit<HTMLAttributes<HTMLHRElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: HTMLHRElement | null;
		style?: string;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		element = $bindable(null),
		style,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<hr
	{...restProps}
	{@attach attachmentFactory(attachments)}
	bind:this={element}
	class={twMerge(
		$theme.Hr.default,
		...variants.map((variant: string) => $theme.Hr[variant]),
		className
	)}
	{style}
/>
