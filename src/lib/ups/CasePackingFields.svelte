<script lang="ts">
	import { Input, Select } from '$lib/components';
	type Props = {
		unitsPerCarton?: string;
		cartonWeight?: string;
		tareWeight?: string;
		partialCase?: 'prorate' | 'full';
		prefix?: string;
		required?: boolean;
		serialize?: boolean;
		inputType?: 'number' | 'text';
	};
	let {
		unitsPerCarton = $bindable(''),
		cartonWeight = $bindable(''),
		tareWeight = $bindable('0'),
		partialCase = $bindable('prorate'),
		prefix = '',
		required = true,
		serialize = true,
		inputType = 'number'
	}: Props = $props();
	const field = (key: string) => (serialize ? (prefix ? `${prefix}.${key}` : key) : undefined);
</script>

<Input
	label="Units per case"
	aria-label="Units per case"
	name={field('unitsPerCarton')}
	type={inputType}
	inputmode="numeric"
	min={1}
	step={1}
	{required}
	bind:value={unitsPerCarton}
/>
<Input
	label="Full case weight (lbs)"
	aria-label="Full case weight (lbs)"
	name={field('cartonWeight')}
	type={inputType}
	inputmode="decimal"
	min={0.001}
	max={150}
	step={0.001}
	{required}
	bind:value={cartonWeight}
/>
<Input
	label="Empty carton weight (lbs)"
	aria-label="Empty carton weight (lbs)"
	name={field('tareWeight')}
	type={inputType}
	inputmode="decimal"
	min={0}
	max={150}
	step={0.001}
	bind:value={tareWeight}
/>
<Select
	label="Partial case weight"
	aria-label="Partial case weight"
	name={field('partialCase')}
	bind:value={partialCase}
	options={[
		{ label: 'Prorate contents + empty carton', value: 'prorate' },
		{ label: 'Use full case weight', value: 'full' }
	]}
/>
