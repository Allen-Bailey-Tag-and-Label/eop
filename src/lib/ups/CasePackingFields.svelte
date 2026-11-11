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
		freight?: boolean;
	};
	let {
		unitsPerCarton = $bindable(''),
		cartonWeight = $bindable(''),
		tareWeight = $bindable('0'),
		partialCase = $bindable('prorate'),
		prefix = '',
		required = true,
		serialize = true,
		inputType = 'number',
		freight = false
	}: Props = $props();
	const field = (key: string) => (serialize ? (prefix ? `${prefix}.${key}` : key) : undefined);
</script>

<Input
	label={freight ? 'Units per pallet' : 'Units per case'}
	aria-label={freight ? 'Units per pallet' : 'Units per case'}
	name={field('unitsPerCarton')}
	type={inputType}
	inputmode="numeric"
	min={1}
	step={1}
	{required}
	bind:value={() => String(unitsPerCarton ?? ''), (value) => (unitsPerCarton = String(value ?? ''))}
/>
<Input
	label={freight ? 'Full pallet weight (lbs)' : 'Full case weight (lbs)'}
	aria-label={freight ? 'Full pallet weight (lbs)' : 'Full case weight (lbs)'}
	name={field('cartonWeight')}
	type={inputType}
	inputmode="decimal"
	min={0.001}
	max={freight ? 20000 : 150}
	step={0.001}
	{required}
	bind:value={() => String(cartonWeight ?? ''), (value) => (cartonWeight = String(value ?? ''))}
/>
<Input
	label={freight ? 'Empty pallet weight (lbs)' : 'Empty carton weight (lbs)'}
	aria-label={freight ? 'Empty pallet weight (lbs)' : 'Empty carton weight (lbs)'}
	name={field('tareWeight')}
	type={inputType}
	inputmode="decimal"
	min={0}
	max={freight ? 20000 : 150}
	step={0.001}
	bind:value={() => String(tareWeight ?? ''), (value) => (tareWeight = String(value ?? ''))}
/>
<Select
	label={freight ? 'Partial pallet weight' : 'Partial case weight'}
	aria-label={freight ? 'Partial pallet weight' : 'Partial case weight'}
	name={field('partialCase')}
	bind:value={partialCase}
	options={[
		{
			label: freight ? 'Prorate contents + empty pallet' : 'Prorate contents + empty carton',
			value: 'prorate'
		},
		{ label: freight ? 'Use full pallet weight' : 'Use full case weight', value: 'full' }
	]}
/>
