<script lang="ts">
	import { Div, Input } from '$lib/components';
	import type { ComponentProps } from 'svelte';
	type Props = Omit<ComponentProps<typeof Input>, 'label' | 'class'> & {
		label: string;
		prefix: string;
		unit?: string;
	};
	let { label, prefix, unit, value = $bindable(''), ...rest }: Props = $props();
</script>

<Div class="relative min-w-0" title={label}>
	<span
		aria-hidden="true"
		class="pointer-events-none absolute inset-y-0 left-2 z-1 flex items-center text-[11px] font-medium text-slate-500 dark:text-gray-400"
		>{prefix}</span
	>
	<Input
		{...rest}
		aria-label={rest['aria-label'] ?? label}
		bind:value
		class={`h-8 min-w-0 rounded-md py-1 pl-8 text-xs tabular-nums ${unit ? 'pr-7' : 'pr-2'}`}
	/>
	{#if unit}<span
			aria-hidden="true"
			class="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] opacity-50"
			>{unit}</span
		>{/if}
</Div>
