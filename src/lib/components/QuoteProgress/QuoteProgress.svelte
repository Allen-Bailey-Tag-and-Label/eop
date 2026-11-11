<script lang="ts">
	import { Card, Div, H2, P, Spinner } from '$lib/components';
	import type { ComponentProps, Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	type Props = Omit<ComponentProps<typeof Card>, 'children'> & {
		steps: { text: string; status: string; message?: string }[];
		summary?: string;
		message?: string;
		busy?: boolean;
		actions?: Snippet;
	};
	let {
		steps,
		summary,
		message,
		busy = false,
		actions,
		class: className,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<Card
	{...restProps}
	{variants}
	class={twMerge('w-full space-y-4', className)}
	role="status"
	aria-live="polite"
	aria-busy={busy}
>
	<H2>Quote progress</H2>
	{#if summary}<P>{summary}</P>{/if}
	{#each steps as step, index (index)}
		<Div class="space-y-1">
			<Div class="flex items-center gap-3">
				{#if ['pending', 'running'].includes(step.status) && !message}<Spinner
						class="h-5 w-5 shrink-0"
						aria-hidden="true"
					/>{/if}
				<P>{step.text}</P>
			</Div>
			{#if step.message}<P
					role={['failed', 'error', 'not-configured'].includes(step.status) ? 'alert' : undefined}
					>{step.message}</P
				>{/if}
		</Div>
	{/each}
	{#if message}<P role="alert">{message}</P>{/if}
	{#if actions}<Div class="flex justify-end">{@render actions()}</Div>{/if}
</Card>
