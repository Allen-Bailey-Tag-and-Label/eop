<script lang="ts">
	import { type Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import Input from '../Input/Input.svelte';

	type Props = { children?: Snippet; class?: string; style?: string };
	let { children, class: className, style, ...restProps }: Props = $props();
</script>

<Input class={twMerge('', className)} {style} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</Input>
