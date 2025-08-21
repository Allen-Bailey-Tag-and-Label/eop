<script lang="ts">
	import { states } from 'states-us';
	import type { Snippet } from 'svelte';
	import zipcodes from 'zipcodes';
	import { Div, H2, Input, Label, Radio, Select } from '$lib/components';

	let {
		_branchId = $bindable(''),
		_branchIdOptions = $bindable([]),
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
	{@render section({ snippet: extraInfo, title: 'Extras' })}
</Div>

{#snippet address({ key }: { key: 'shipFrom' | 'shipTo' })}
	<Input
		bind:value={formData[key].address}
		label="Address"
		name="{key}Address"
		required={isValidationCheckboxRequired && isValidationRequired ? true : undefined}
	/>
	<Input
		bind:value={formData[key].zip}
		class="text-right"
		label="ZIP"
		max={99999}
		min={1}
		name="{key}ZIP"
		onchange={() => {
			const result = zipcodes.lookup(formData[key].zip.toString().padStart(5, '0'));
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
{#snippet extraInfo()}
	{#if isValidationCheckboxRequired}
		<Div class="flex flex-col">
			<Label>Validation</Label>
			<Div class="flex space-x-2">
				{#each [{ label: 'No', value: false }, { label: 'Yes', value: true }] as { label, value }}
					<Radio bind:group={isValidationRequired} name="isValidated" {value} variants={['box']}>
						{label}
					</Radio>
				{/each}
			</Div>
		</Div>
		{#if _branchIdOptions.length > 2}
			<Div class="flex flex-col">
				<Label>Branch</Label>
				<Select
					bind:value={_branchId}
					name="_branchId"
					options={_branchIdOptions}
					required={true}
				/>
			</Div>
		{/if}
	{/if}
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
{/snippet}

{#snippet section({ snippet, title, ...restProps }: { snippet: Snippet; title: string } & any)}
	<Div class="flex flex-col space-y-2">
		<H2>{title}</H2>
		{@render snippet(restProps)}
	</Div>
{/snippet}
