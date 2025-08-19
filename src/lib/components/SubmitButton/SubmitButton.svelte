<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { Button, Div, Spinner } from '..';
	import { twMerge } from 'tailwind-merge';

	type Props = HTMLAttributes<HTMLButtonElement> & {
		children?: Snippet;
		class?: string;
		isLoading?: boolean;
		element?: HTMLButtonElement | null;
		formaction?: string;
		type?: 'button' | 'submit';
		variants?: string[];
	};

	let {
		children,
		class: className,
		isLoading = $bindable(false),
		element = $bindable(null),
		formaction,
		type = 'submit',
		variants = [],
		...restProps
	}: Props = $props();
</script>

<Button
	{...restProps}
	bind:element
	class={twMerge('relative overflow-hidden', className)}
	{formaction}
	{type}
	{variants}
>
	<Div
		class={twMerge('transition duration-200', isLoading ? '-translate-y-[200%]' : 'translate-y-0')}
	>
		{#if children}
			{@render children()}
		{/if}
	</Div>
	<Div
		class={twMerge(
			'absolute top-1/2 left-1/2 -translate-x-1/2 transition duration-200',
			isLoading ? '-translate-y-1/2' : '-translate-y-[250%]'
		)}
	>
		<Spinner />
	</Div>
</Button>
