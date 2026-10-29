<script lang="ts">
	import { Div, Select } from '$lib/components';
	import InspectorInput from './InspectorInput.svelte';
	import { paddingSides } from './padding';
	import type { ElementPadding } from './types';
	let { value = $bindable() }: { value?: ElementPadding } = $props();
	const mode = $derived(value === undefined || typeof value === 'number' ? 'uniform' : value.mode);
	const sides = $derived(paddingSides(value));
	function set(side: 'all' | 'x' | 'y' | 'top' | 'right' | 'bottom' | 'left', amount: number) {
		if (!Number.isFinite(amount)) return;
		amount = Math.max(0, Math.min(256, amount));
		if (side === 'all') value = amount;
		else if (side === 'x' || side === 'y')
			value = { mode: 'axis', x: sides.left, y: sides.top, [side]: amount };
		else value = { mode: 'sides', ...sides, [side]: amount };
	}
</script>

<Select
	aria-label="Padding mode"
	title="Padding mode"
	value={mode}
	options={[
		{ value: 'uniform', label: 'Uniform' },
		{ value: 'axis', label: 'Horizontal / Vertical' },
		{ value: 'sides', label: 'Individual sides' }
	]}
	onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
		if (event.currentTarget.value === 'uniform') value = sides.top;
		else if (event.currentTarget.value === 'axis')
			value = { mode: 'axis', x: sides.left, y: sides.top };
		else value = { mode: 'sides', ...sides };
	}}
/>
<Div class="grid min-w-0 grid-cols-2 gap-2">
	{#each mode === 'uniform' ? [{ key: 'all', label: 'Padding', prefix: 'All', value: sides.top }] : mode === 'axis' ? [{ key: 'x', label: 'Horizontal padding', prefix: 'X', value: sides.left }, { key: 'y', label: 'Vertical padding', prefix: 'Y', value: sides.top }] : [{ key: 'top', label: 'Top padding', prefix: 'T', value: sides.top }, { key: 'right', label: 'Right padding', prefix: 'R', value: sides.right }, { key: 'bottom', label: 'Bottom padding', prefix: 'B', value: sides.bottom }, { key: 'left', label: 'Left padding', prefix: 'L', value: sides.left }] as field (field.key)}
		<InspectorInput
			label={field.label}
			prefix={field.prefix}
			type="number"
			min={0}
			max={256}
			value={String(field.value)}
			oninput={(event) =>
				set(field.key as Parameters<typeof set>[0], event.currentTarget.valueAsNumber)}
		/>
	{/each}
</Div>
