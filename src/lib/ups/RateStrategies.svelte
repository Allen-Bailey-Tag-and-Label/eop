<script lang="ts">
	import {
		Button,
		Card,
		Checkbox,
		Details,
		Div,
		H3,
		Input,
		Label,
		P,
		Summary,
		Tabs,
		Textarea
	} from '$lib/components';
	import { Copy, Plus, Trash2 } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import {
		blankRateScenario,
		MAX_RATE_SCENARIOS,
		UPS_SERVICES,
		type RateScenarioInput
	} from './quote';
	import { calculateCases } from './casePacking';
	import PackageWeights from './PackageWeights.svelte';
	import CasePackingFields from './CasePackingFields.svelte';
	let { rows = $bindable([]) }: { rows?: RateScenarioInput[] } = $props();
	const hasAdvancedSettings = () =>
		rows.length > 1 ||
		rows.some(
			(row) => row.label || UPS_SERVICES.some((service) => !row.services.includes(service.code))
		);
	let advanced = $state(untrack(hasAdvancedSettings));
	let loadedRow: string | undefined;
	$effect(() => {
		const id = rows[0]?.id;
		if (id !== loadedRow) {
			loadedRow = id;
			advanced = untrack(hasAdvancedSettings);
		}
	});
	let quantities = $state(''),
		unitsPerCarton = $state(''),
		cartonWeight = $state(''),
		tareWeight = $state('0');
	let partialCase = $state<'prorate' | 'full'>('prorate');
	let helperError = $state('');
	const quantityExample = '10000\n20000\n30000';
	function add() {
		rows = [...rows, blankRateScenario()];
	}
	function duplicate(row: RateScenarioInput) {
		rows = [
			...rows,
			{
				...row,
				id: crypto.randomUUID(),
				services: [...row.services],
				groups: row.groups.map((group) => ({ ...group, id: crypto.randomUUID() }))
			}
		];
	}
	function buildRows() {
		helperError = '';
		try {
			const values = quantities
				.split(/[\n;]+/)
				.map((line) => line.trim())
				.filter(Boolean);
			if (!values.length) throw new Error('Enter at least one total quantity, one per line.');
			const generated = values.map((line) => {
				if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(line))
					throw new Error('Enter one whole-number quantity per line.');
				const units = Number(line.replaceAll(',', ''));
				calculateCases(units, {
					unitsPerCarton: Number(unitsPerCarton),
					cartonWeight: Number(cartonWeight),
					tareWeight: Number(tareWeight || 0),
					partialCase
				});
				return {
					...blankRateScenario(),
					unitQuantity: String(units),
					weightMode: 'cartons' as const,
					unitsPerCarton,
					cartonWeight,
					tareWeight,
					partialCase,
					services: [...(rows[0]?.services ?? UPS_SERVICES.map((service) => service.code))]
				};
			});
			const existing = rows.filter(
				(row) =>
					row.unitQuantity ||
					row.label ||
					row.totalPackages ||
					row.totalWeight ||
					row.eachWeight ||
					row.groups.length
			);
			if (existing.length + generated.length > MAX_RATE_SCENARIOS)
				throw new Error(`Use at most ${MAX_RATE_SCENARIOS} rate rows per quote.`);
			rows = [...existing, ...generated];
		} catch (cause) {
			helperError = cause instanceof Error ? cause.message : 'Check the case details.';
		}
	}
</script>

<Div class="col-span-full grid min-w-0 grid-cols-subgrid gap-y-6">
	<Input type="hidden" name="rateScenarios" value={JSON.stringify(rows)} />
	<Tabs
		class="col-span-full"
		aria-label="Shipment options"
		value={advanced ? 'advanced' : 'simple'}
		onValueChange={(value) => (advanced = value === 'advanced')}
		tabs={[
			{ title: 'Simple', value: 'simple' },
			{ title: 'Advanced', value: 'advanced' }
		]}
	/>
	{#if !advanced}
		{#if hasAdvancedSettings()}
			<P class="col-span-full"
				>Editing the first shipment. Additional quantities and service selections are retained in
				Advanced.</P
			>
		{/if}
		{#if rows[0]}
			{#if rows[0].weightMode === 'cartons'}
				<Input
					label="Total units"
					aria-label="Total units"
					name="unitQuantity"
					type="number"
					min={1}
					step={1}
					required
					bind:value={rows[0].unitQuantity}
				/>
			{/if}
			<PackageWeights
				bind:mode={rows[0].weightMode}
				bind:totalPackages={rows[0].totalPackages}
				bind:totalWeight={rows[0].totalWeight}
				bind:eachWeight={rows[0].eachWeight}
				bind:groups={rows[0].groups}
				unitQuantity={rows[0].unitQuantity}
				bind:unitsPerCarton={rows[0].unitsPerCarton}
				bind:cartonWeight={rows[0].cartonWeight}
				bind:tareWeight={rows[0].tareWeight}
				bind:partialCase={rows[0].partialCase}
			/>
		{/if}
	{:else}
		<Details class="col-span-full">
			<Summary class="cursor-pointer font-semibold">Build rows from case quantities</Summary>
			<Div class="grid min-w-0 grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
				<P class="col-span-full"
					>Enter the packing once, then add quantities such as 10000, 20000, and 30000 on separate
					lines. New rows use the first row’s service choices.</P
				>
				<CasePackingFields
					bind:unitsPerCarton
					bind:cartonWeight
					bind:tareWeight
					bind:partialCase
					required={false}
					serialize={false}
					inputType="text"
				/>
				<Div class="col-span-full"
					><Textarea
						aria-label="Total quantities, one per line"
						label="Total quantities (one per line)"
						bind:value={quantities}
						rows={3}
						placeholder={quantityExample}
					/></Div
				>
				{#if helperError}<P class="col-span-full" role="alert">{helperError}</P>{/if}
				<Div class="col-span-full flex justify-end"
					><Button variants={['small']} onclick={buildRows}>Add calculated rate rows</Button></Div
				>
			</Div>
		</Details>
		{#each rows as row, index (row.id)}
			<Card
				role="region"
				aria-label={`Rate scenario ${index + 1}`}
				class="col-span-full grid min-w-0 grid-cols-subgrid gap-y-4 p-4"
			>
				<Div class="col-span-full flex items-center justify-between gap-4"
					><H3 class="text-base">Rate row {index + 1}</H3><Div class="flex gap-2">
						<Button
							variants={['ghost', 'icon']}
							aria-label={`Duplicate rate row ${index + 1}`}
							disabled={rows.length >= MAX_RATE_SCENARIOS}
							onclick={() => duplicate(row)}><Copy size={18} aria-hidden="true" /></Button
						>
						<Button
							variants={['ghost', 'icon']}
							aria-label={`Remove rate row ${index + 1}`}
							disabled={rows.length === 1}
							onclick={() => (rows = rows.filter((item) => item.id !== row.id))}
							><Trash2 size={18} aria-hidden="true" /></Button
						>
					</Div></Div
				>
				<Input
					label="Label (optional)"
					aria-label={`Label for rate row ${index + 1}`}
					name={`scenario.${row.id}.label`}
					bind:value={row.label}
					maxlength={160}
				/>
				<Input
					label="Total units"
					aria-label={`Total units for rate row ${index + 1}`}
					name={index === 0 ? 'unitQuantity' : `scenario.${row.id}.unitQuantity`}
					type="number"
					min={1}
					step={1}
					required={row.weightMode === 'cartons'}
					bind:value={row.unitQuantity}
				/>
				<Div
					class="col-span-full grid min-w-0 grid-cols-subgrid gap-y-2"
					role="group"
					aria-label={`Services for rate row ${index + 1}`}
				>
					<P class="col-span-full font-semibold">Services</P>
					{#each UPS_SERVICES as service (service.code)}<Div class="flex items-center gap-2"
							><Checkbox
								id={`service-${row.id}-${service.code}`}
								aria-label={service.title}
								checked={row.services.includes(service.code)}
								onchange={(event) => {
									row.services = event.currentTarget.checked
										? [...row.services, service.code]
										: row.services.filter((code) => code !== service.code);
								}}
							/><Label for={`service-${row.id}-${service.code}`}>{service.title}</Label></Div
						>{/each}
					{#if !row.services.length}<P class="col-span-full" role="alert"
							>Select at least one service.</P
						>{/if}
				</Div>
				<PackageWeights
					prefix={index === 0 ? '' : `scenario.${row.id}`}
					bind:mode={row.weightMode}
					bind:totalPackages={row.totalPackages}
					bind:totalWeight={row.totalWeight}
					bind:eachWeight={row.eachWeight}
					bind:groups={row.groups}
					unitQuantity={row.unitQuantity}
					bind:unitsPerCarton={row.unitsPerCarton}
					bind:cartonWeight={row.cartonWeight}
					bind:tareWeight={row.tareWeight}
					bind:partialCase={row.partialCase}
				/>
			</Card>
		{/each}
		<Div class="col-span-full flex justify-end"
			><Button
				variants={['small']}
				class="flex items-center gap-2"
				disabled={rows.length >= MAX_RATE_SCENARIOS}
				onclick={add}><Plus size={16} aria-hidden="true" />Add rate row</Button
			></Div
		>
	{/if}
</Div>
