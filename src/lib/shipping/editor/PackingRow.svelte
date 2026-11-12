<script lang="ts">
	import { Card, Checkbox, Div, H3, Input, P, Tabs } from '$lib/components';
	import PackageWeights from '$lib/ups/PackageWeights.svelte';
	import {
		changePackingBasis,
		packingSummary,
		distributeWeight,
		layoutFreight,
		type PalletShape,
		type ShippingScenarioInput
	} from '../packing';
	import type { QuoteServices, ShippingService } from '../types';
	import { freightDensity } from '../density';
	let {
		row = $bindable(),
		services,
		index
	}: { row: ShippingScenarioInput; services: QuoteServices; index: number } = $props();
	const meta = $derived(row.shipping!);
	const combinedPlain = $derived(
		services === 'Both' &&
			row.weightMode === 'total' &&
			!(meta.basis === 'UPS' && meta.layouts?.length)
	);
	const preview = $derived.by(() => {
		try {
			return { value: packingSummary(row), error: '' };
		} catch (error) {
			return {
				value: null,
				error: error instanceof Error ? error.message : 'Enter packing details.'
			};
		}
	});
	const densities = $derived.by(() => {
		if (services === 'UPS' || !preview.value) return [];
		try {
			if (meta.basis === 'UPS' && meta.layouts?.length)
				return layoutFreight(preview.value.totalWeight, meta).map(freightDensity);
			const groups =
				meta.basis === 'LTL'
					? preview.value.groups
					: distributeWeight(preview.value.totalWeight, Number(meta.palletCount));
			return groups.map((group, index) => {
				const shape =
					meta.basis === 'LTL' && row.weightMode === 'groups'
						? (meta.shapes?.[row.groups[index].id] ?? meta)
						: meta;
				return freightDensity({
					...group,
					length: Number(shape.length),
					width: Number(shape.width),
					height: Number(shape.height)
				});
			});
		} catch {
			return [];
		}
	});
	$effect(() => {
		if (services !== 'Both' && meta.basis !== services) changePackingBasis(row, services);
	});
	function setShape(groupId: string, key: keyof PalletShape, value: string | boolean) {
		meta.shapes ??= {};
		const base = meta.shapes[groupId] ?? meta;
		meta.shapes[groupId] = {
			length: base.length,
			width: base.width,
			height: base.height,
			nmfc: base.nmfc,
			stackable: base.stackable,
			[key]: value
		} as PalletShape;
	}
	function countValue(service: ShippingService) {
		return String(
			(meta.basis === service
				? row.totalPackages
				: meta[service === 'UPS' ? 'packageCount' : 'palletCount']) ?? ''
		);
	}
	function setCount(service: ShippingService, value: string) {
		if (meta.basis === service) row.totalPackages = String(value ?? '');
		else meta[service === 'UPS' ? 'packageCount' : 'palletCount'] = String(value ?? '');
	}
</script>

{#if services === 'Both'}
	<Tabs
		class="col-span-full"
		aria-label={`Weight entry basis for rate row ${index + 1}`}
		value={meta.basis}
		onValueChange={(value) => changePackingBasis(row, value)}
		tabs={[
			{ title: 'Enter package weights', value: 'UPS' },
			{ title: 'Enter pallet weights', value: 'LTL' }
		]}
	/>
{/if}
{#if services !== 'Both'}<H3 class="col-span-full text-base"
		>{meta.basis === 'UPS' ? 'UPS packages' : 'LTL freight'}</H3
	>{/if}
<PackageWeights
	fields={services === 'Both' && row.weightMode === 'total' ? combinedWeightFields : undefined}
	showSummary={services !== 'Both'}
	splitTotal={distributeWeight}
	freight={meta.basis === 'LTL'}
	prefix={`packing.${row.id}`}
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
{#if services === 'Both' && row.weightMode !== 'total'}
	{#if !(meta.basis === 'UPS' && meta.layouts?.length)}
		<Input
			type="number"
			min={1}
			max={meta.basis === 'UPS' ? 100 : 50}
			step={1}
			required
			label={meta.basis === 'UPS' ? 'Pallet quantity' : 'Total Packages'}
			aria-label={meta.basis === 'UPS' ? 'Pallet quantity' : 'Total Packages'}
			bind:value={meta[meta.basis === 'UPS' ? 'palletCount' : 'packageCount']}
		/>
	{/if}
{/if}
{#if services !== 'UPS' && !combinedPlain}
	{#if meta.basis === 'UPS' && meta.layouts?.length}
		{#each meta.layouts as layout, layoutIndex (layout.id)}
			<Card class="col-span-full grid grid-cols-subgrid gap-y-4 p-4">
				<H3 class="col-span-full text-base">Pallet group {layoutIndex + 1}</H3>
				<Input
					type="number"
					label="Pallet quantity"
					aria-label={`Pallet quantity for layout ${layoutIndex + 1}`}
					min={1}
					max={100}
					step={1}
					required
					bind:value={
						() => String(layout.quantity ?? ''), (value) => (layout.quantity = String(value ?? ''))
					}
				/>
				{#each ['length', 'width', 'height', 'nmfc'] as field (field)}
					<Input
						type={field === 'nmfc' ? 'text' : 'number'}
						required
						step={0.01}
						label={field === 'nmfc'
							? 'NMFC code'
							: `${field[0].toUpperCase()}${field.slice(1)} (in)`}
						aria-label={`${field} for pallet layout ${layoutIndex + 1}`}
						value={layout.shape[field as 'length' | 'width' | 'height' | 'nmfc']}
						oninput={(event) =>
							(layout.shape[field as 'length' | 'width' | 'height' | 'nmfc'] =
								event.currentTarget.value)}
					/>
				{/each}
				<Checkbox label="Stackable" bind:checked={layout.shape.stackable} />
			</Card>
		{/each}
	{:else if meta.basis === 'LTL' && row.weightMode === 'groups'}
		{#each row.groups as group, groupIndex (group.id)}
			<Div class="col-span-full grid grid-cols-subgrid gap-y-4">
				<H3 class="col-span-full text-base">Pallet group {groupIndex + 1} dimensions</H3>
				{#each ['length', 'width', 'height', 'nmfc'] as field (field)}
					<Input
						type={field === 'nmfc' ? 'text' : 'number'}
						required
						min={field === 'nmfc' ? undefined : 0.01}
						step={0.01}
						label={field === 'nmfc'
							? 'NMFC code'
							: `${field[0].toUpperCase()}${field.slice(1)} (in)`}
						aria-label={`${field === 'nmfc' ? 'NMFC code' : `${field[0].toUpperCase()}${field.slice(1)} (in)`} for pallet group ${groupIndex + 1}`}
						value={(meta.shapes?.[group.id] ?? meta)[
							field as 'length' | 'width' | 'height' | 'nmfc'
						]}
						oninput={(event) =>
							setShape(group.id, field as keyof PalletShape, event.currentTarget.value)}
					/>
				{/each}
				<Checkbox
					label="Stackable"
					checked={(meta.shapes?.[group.id] ?? meta).stackable}
					onchange={(event) => setShape(group.id, 'stackable', event.currentTarget.checked)}
				/>
			</Div>
		{/each}
	{:else}
		{@render palletShapeFields()}
	{/if}
{/if}
{#if services === 'Both'}
	<P class="col-span-full"
		>One total shipment weight is used for both services. Package and pallet counts are independent.</P
	>
	<P class="col-span-full" aria-live="polite"
		>{preview.value
			? `Shared total weight: ${preview.value.totalWeight} lb`
			: 'Enter the shipment weight above to calculate both services.'}</P
	>
	{#if preview.value}
		<P class="col-span-full"
			>{preview.value.count} {meta.basis === 'UPS' ? 'packages' : 'pallets'}</P
		>
		{#each preview.value.groups as group, groupIndex (groupIndex)}<P class="col-span-full"
				>{group.quantity} @ {group.weight} lbs</P
			>{/each}
	{/if}
{/if}
{#each densities as density, densityIndex (densityIndex)}
	{#if density}<P class="col-span-full"
			>Pallet group {densityIndex + 1} density: {density.density.toFixed(2)} lb/ft³ - Density class:
			{density.freightClass}</P
		>{/if}
{/each}
{#if preview.error && (services === 'Both' || row.weightMode !== 'cartons') && (row.totalPackages || row.totalWeight || row.eachWeight || row.groups.length || row.unitQuantity)}<P
		class="col-span-full"
		role="status">{preview.error}</P
	>{/if}

{#snippet combinedWeightFields()}
	<Input
		type="number"
		label="Total Packages"
		aria-label="Total Packages"
		name={`packing.${row.id}.packageInfoTotalPackages`}
		min={1}
		max={50}
		step={1}
		required
		bind:value={() => countValue('UPS'), (value) => setCount('UPS', value)}
	/>
	<Input
		type="number"
		label="Total Weight (lbs)"
		aria-label="Total Weight (lbs)"
		name={`packing.${row.id}.packageInfoTotalWeight`}
		min={0.001}
		step={0.001}
		required
		bind:value={
			() => String(row.totalWeight ?? ''), (value) => (row.totalWeight = String(value ?? ''))
		}
	/>
	{#if !(meta.basis === 'UPS' && meta.layouts?.length)}
		<Input
			type="number"
			label="Pallet quantity"
			aria-label="Pallet quantity"
			min={1}
			max={100}
			step={1}
			required
			bind:value={() => countValue('LTL'), (value) => setCount('LTL', value)}
		/>
		{@render palletShapeFields()}
	{/if}
{/snippet}

{#snippet palletShapeFields()}
	{#each ['length', 'width', 'height'] as field (field)}
		<Input
			type="number"
			label={`${field[0].toUpperCase()}${field.slice(1)} (in)`}
			aria-label={`${field[0].toUpperCase()}${field.slice(1)} (in)`}
			min={0.01}
			step={0.01}
			required
			bind:value={
				() => String(meta[field as 'length' | 'width' | 'height'] ?? ''),
				(value) => (meta[field as 'length' | 'width' | 'height'] = String(value ?? ''))
			}
		/>
	{/each}
	<Input label="NMFC code" aria-label="NMFC code" required maxlength={40} bind:value={meta.nmfc} />
	<Checkbox label="Stackable" bind:checked={meta.stackable} />
{/snippet}
