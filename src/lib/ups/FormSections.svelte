<script lang="ts">
	import { states } from 'states-us';
	import type { Snippet } from 'svelte';
	import zipcodes from 'zipcodes';
	import { Button, Div, H2, H3, Input, Label, Radio, Select } from '$lib/components';
	import { ArrowLeftRight } from '@lucide/svelte';
	import QuoteLayout from '$lib/ups/QuoteLayout.svelte';
	import RateStrategies from '$lib/ups/RateStrategies.svelte';
	import type { RateScenarioInput } from '$lib/ups/quote';
	type AddressInput = { address: string; city: string; state: string; zip: string };
	type Props = {
		_branchId?: string;
		_branchIdOptions?: { label: string; value: string }[];
		formData?: {
			shipFrom: AddressInput;
			shipTo: AddressInput;
			packageInfo: { totalPackages: string; totalWeight: string };
		};
		isValidationCheckboxRequired?: boolean;
		isValidationRequired?: boolean;
		responsive?: boolean;
		rateRows?: RateScenarioInput[];
		actions?: Snippet;
		services?: Snippet;
		packageFields?: Snippet;
		extraFields?: Snippet;
	};

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
		isValidationRequired = $bindable(true),
		responsive = false,
		rateRows = $bindable([] as RateScenarioInput[]),
		actions = undefined as Snippet | undefined,
		services = undefined as Snippet | undefined,
		packageFields = undefined as Snippet | undefined,
		extraFields = undefined as Snippet | undefined
	}: Props = $props();

	const stateOptions = $derived.by(() => [
		{ label: '', value: '' },
		...states.map(({ abbreviation }) => ({ label: abbreviation, value: abbreviation }))
	]);
</script>

{#if responsive}
	<QuoteLayout
		shipment={shipmentDetails}
		packages={packageInfo}
		extras={extraInfo}
		{actions}
		{services}
	/>
{:else}
	<Div class="flex flex-col gap-4 lg:flex-row">
		<Div class="flex flex-col space-y-2"
			><H2>Ship From</H2>{@render address({ key: 'shipFrom' })}</Div
		>
		<Div class="flex flex-col space-y-2"><H2>Ship To</H2>{@render address({ key: 'shipTo' })}</Div>
		<Div class="flex flex-col space-y-2"><H2>Package Info</H2>{@render packageInfo()}</Div>
		<Div class="flex flex-col space-y-2"><H2>Extras</H2>{@render extraInfo()}</Div>
	</Div>
{/if}

{#snippet shipmentDetails()}
	<Div class="col-span-full grid min-w-0 grid-cols-subgrid gap-y-6">
		<Div class="col-span-full flex justify-end"
			><Button
				variants={['small']}
				class="flex items-center gap-2"
				aria-label="Swap Ship From and Ship To"
				onclick={() => {
					const from = { ...formData.shipFrom };
					formData.shipFrom = { ...formData.shipTo };
					formData.shipTo = from;
				}}><ArrowLeftRight size={16} aria-hidden="true" />Swap addresses</Button
			></Div
		>
		{#each ['shipFrom', 'shipTo'] as key (key)}
			<Div class="min-w-0 space-y-4">
				<H3 class="text-base">{key === 'shipFrom' ? 'Ship From' : 'Ship To'}</H3>
				{@render address({ key: key as 'shipFrom' | 'shipTo' })}
			</Div>
		{/each}
	</Div>
{/snippet}

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
				{#each [{ label: 'No', value: false }, { label: 'Yes', value: true }] as { label, value } (label)}
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
	{#if extraFields}{@render extraFields()}{/if}
{/snippet}
{#snippet packageInfo()}
	{#if packageFields}
		{@render packageFields()}
	{:else if responsive}
		<RateStrategies bind:rows={rateRows} />
	{:else}
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
	{/if}
{/snippet}
