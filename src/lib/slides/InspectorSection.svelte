<script lang="ts">
	import { Details, Div } from '$lib/components';
	import { ChevronDown } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	let {
		title,
		open = $bindable(false),
		element = $bindable(null),
		children
	}: {
		title: string;
		open?: boolean;
		element?: HTMLDetailsElement | null;
		children: Snippet;
	} = $props();
</script>

<Details
	bind:open
	bind:element
	class="group/section min-w-0 rounded-none border-b border-slate-200 py-1 dark:border-gray-800"
>
	<summary
		class="flex min-h-8 cursor-pointer list-none items-center justify-between gap-2 rounded px-1 text-xs font-semibold outline-offset-2 focus-visible:outline-2 focus-visible:outline-sky-500 [&::-webkit-details-marker]:hidden"
	>
		{title}<ChevronDown
			size={13}
			aria-hidden="true"
			class="shrink-0 opacity-50 transition-transform group-open/section:rotate-180"
		/>
	</summary>
	<Div class="min-w-0 space-y-2.5 px-1 pt-1 pb-3">{@render children()}</Div>
</Details>
