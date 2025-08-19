<script lang="ts">
	import { states } from 'states-us';
	import type { Snippet } from 'svelte';
	import zipcodes from 'zipcodes';
	import { Checkbox, Div, H2, Input, Select } from '$lib/components';

	let {
		formData = $bindable({
			shipFrom: {
				address: '3177 Lehigh Street',
				city: 'Caledonia',
				state: 'NY',
				zip: '14423'
			},
			shipTo: {
				address: '',
				city: '',
				state: '',
				zip: ''
			},
			packageInfo: {
				totalPackages: '',
				totalWeight: ''
			}
		}),
		isValidationCheckboxRequired = $bindable(true),
		isValidationRequired = $bindable(true)
	} = $props();

	const stateOptions = $derived.by(() => [
		{ label: '', value: '' },
		...states.map(({ abbreviation }) => ({ label: abbreviation, value: abbreviation }))
	]);
</script>

<Div class="flex flex-col gap-4 lg:flex-row">
	{@render section({ key: 'shipFrom', snippet: address, title: 'Ship From' })}
	{@render section({ key: 'shipTo', snippet: address, title: 'Ship To' })}
	{@render section({ snippet: packageInfo, title: 'Package Info' })}
</Div>

{#snippet address({ key }: { key: 'shipFrom' | 'shipTo' })}
	<Input bind:value={formData[key].address} label="Address" name="{key}Address" required={true} />
	<Input
		bind:value={formData[key].zip}
		class="text-right"
		label="ZIP"
		max={99999}
		min={10000}
		name="{key}ZIP"
		onchange={() => {
			const result = zipcodes.lookup(formData[key].zip);
			if (result === undefined) return;
			formData[key].city = result.city;
			formData[key].state = result.state;
		}}
		required={true}
		type="number"
	/>
	<Input bind:value={formData[key].city} label="City" name="{key}City" required={true} />
	<Select
		bind:value={formData[key].state}
		label="State"
		name="{key}State"
		options={stateOptions}
		required={true}
	/>
{/snippet}
{#snippet packageInfo()}
	<Input
		bind:value={formData.packageInfo.totalPackages}
		class="text-right"
		label="Total Packages"
		name="packageInfoTotalPackages"
		required={true}
		type="number"
	/>
	<Input
		bind:value={formData.packageInfo.totalWeight}
		class="text-right"
		label="Total Weight"
		name="packageInfoTotalWeight"
		required={true}
		type="number"
	/>
	{#if isValidationCheckboxRequired}
		<Checkbox bind:checked={isValidationRequired} label="Validate?" />
	{/if}
{/snippet}

{#snippet section({ snippet, title, ...restProps }: { snippet: Snippet; title: string } & any)}
	<Div class="flex flex-col space-y-2">
		<H2>{title}</H2>
		{@render snippet(restProps)}
	</Div>
{/snippet}
