<script lang="ts">
	import { Button, Card, Div, Input, P, Tabs } from '$lib/components';
	import { Plus, Trash2 } from '@lucide/svelte';
	import { MAX_QUOTE_PACKAGES, type PackageGroupInput, type WeightMode } from './quote';
	import CasePackingFields from './CasePackingFields.svelte';
	import { calculateCases } from './casePacking';
	import type { Snippet } from 'svelte';
	type Props = {
		mode?: WeightMode;
		totalPackages?: string;
		totalWeight?: string;
		eachWeight?: string;
		groups?: PackageGroupInput[];
		prefix?: string;
		unitQuantity?: string;
		unitsPerCarton?: string;
		cartonWeight?: string;
		tareWeight?: string;
		partialCase?: 'prorate' | 'full';
		simple?: boolean;
		freight?: boolean;
		fields?: Snippet;
		showSummary?: boolean;
		splitTotal?: (weight: number, count: number) => { quantity: number; weight: number }[];
	};
	let {
		mode = $bindable('total'),
		totalPackages = $bindable(''),
		totalWeight = $bindable(''),
		eachWeight = $bindable(''),
		groups = $bindable([]),
		prefix = '',
		unitQuantity = '',
		unitsPerCarton = $bindable(''),
		cartonWeight = $bindable(''),
		tareWeight = $bindable('0'),
		partialCase = $bindable('prorate'),
		simple = false,
		freight = false,
		fields,
		showSummary = true,
		splitTotal
	}: Props = $props();
	const field = (key: string) => (prefix ? `${prefix}.${key}` : key);
	const maxCount = $derived(freight ? 100 : MAX_QUOTE_PACKAGES);
	const maxWeight = $derived(freight ? 20000 : 150);
	const cases = $derived.by(() => {
		if (mode !== 'cartons') return { result: null, error: '' };
		try {
			return {
				result: calculateCases(
					Number(unitQuantity),
					{
						unitsPerCarton: Number(unitsPerCarton),
						cartonWeight: Number(cartonWeight),
						tareWeight: Number(tareWeight || 0),
						partialCase
					},
					{ maxWeight, maxCount }
				),
				error: ''
			};
		} catch (cause) {
			return {
				result: null,
				error: cause instanceof Error ? cause.message : 'Enter case details.'
			};
		}
	});
	const count = $derived(
		mode === 'cartons'
			? (cases.result?.packageTotalCount ?? 0)
			: mode === 'groups'
				? groups.reduce((sum, group) => sum + (Number(group.quantity) || 0), 0)
				: Number(totalPackages) || 0
	);
	const weight = $derived(
		mode === 'cartons'
			? (cases.result?.packageTotalWeight ?? 0)
			: mode === 'groups'
				? groups.reduce(
						(sum, group) => sum + (Number(group.quantity) || 0) * (Number(group.weight) || 0),
						0
					)
				: mode === 'each'
					? count * (Number(eachWeight) || 0)
					: Number(totalWeight) || 0
	);
	function addGroup() {
		groups = [...groups, { id: crypto.randomUUID(), quantity: '1', weight: '' }];
	}
	function select(next: WeightMode) {
		if (next === 'groups' && !groups.length) {
			if (splitTotal && count > 0 && weight > 0) {
				try {
					const values =
						mode === 'cartons' && cases.result
							? cases.result.packageGroups
							: splitTotal(weight, count);
					groups = values.map((group) => ({
						id: crypto.randomUUID(),
						quantity: String(group.quantity),
						weight: String(group.weight)
					}));
				} catch {
					groups = [{ id: crypto.randomUUID(), quantity: String(count), weight: '' }];
				}
				mode = next;
				return;
			}
			const estimate =
				mode === 'each'
					? Number(eachWeight)
					: count > 0
						? Math.ceil((weight / count) * 1000 - 1e-9) / 1000
						: 0;
			groups = [
				{
					id: crypto.randomUUID(),
					quantity: count > 0 ? String(count) : '1',
					weight: estimate > 0 ? String(estimate) : ''
				}
			];
		}
		mode = next;
	}
</script>

<Div class="col-span-full grid min-w-0 grid-cols-subgrid gap-y-4">
	{#if !simple}<Tabs
			class="col-span-full"
			aria-label={freight ? 'Pallet weight entry' : 'Package weight entry'}
			value={mode}
			onValueChange={select}
			tabs={[
				{ title: 'Total weight', value: 'total' },
				{ title: freight ? 'Per pallet' : 'Per package', value: 'each' },
				{ title: 'Different weights', value: 'groups' },
				{ title: 'Cases / units', value: 'cartons' }
			]}
		/>{/if}
	<Input type="hidden" name={field('weightMode')} value={mode} />
	{#if fields}
		{@render fields()}
	{:else if mode === 'cartons'}
		<CasePackingFields
			{freight}
			bind:unitsPerCarton
			bind:cartonWeight
			bind:tareWeight
			bind:partialCase
			{prefix}
		/>
		{#if showSummary && cases.result}
			<P class="col-span-full" aria-live="polite"
				>{cases.result.packageTotalCount}
				{freight ? 'pallets' : 'cartons'} · {cases.result.packageTotalWeight} lbs total</P
			>
			{#each cases.result.packageGroups as group, index (index)}<P class="col-span-full"
					>{group.quantity}
					{freight
						? group.quantity === 1
							? 'pallet'
							: 'pallets'
						: group.quantity === 1
							? 'carton'
							: 'cartons'} @ {group.weight} lbs</P
				>{/each}
		{:else if showSummary}<P class="col-span-full" role="status">{cases.error}</P>{/if}
	{:else if mode === 'groups'}
		<Input
			type="hidden"
			name={field('packageGroups')}
			value={JSON.stringify(groups.map(({ quantity, weight }) => ({ quantity, weight })))}
		/>
		{#each groups as group, index (group.id)}
			<Card class="col-span-full grid min-w-0 grid-cols-subgrid gap-y-4 p-4">
				<Div class="col-span-full flex items-center justify-between gap-4"
					><P class="font-semibold">{freight ? 'Pallet group' : 'Package group'} {index + 1}</P
					><Button
						variants={['ghost', 'icon']}
						aria-label={`Remove ${freight ? 'pallet' : 'package'} group ${index + 1}`}
						disabled={groups.length === 1}
						onclick={() => (groups = groups.filter((item) => item.id !== group.id))}
						><Trash2 size={18} aria-hidden="true" /></Button
					></Div
				>
				<Input
					label="Quantity"
					aria-label={`Quantity for group ${index + 1}`}
					name={field(`packageGroup.${group.id}.quantity`)}
					type="number"
					min={1}
					max={maxCount}
					step={1}
					required
					bind:value={
						() => String(group.quantity ?? ''), (value) => (group.quantity = String(value ?? ''))
					}
				/>
				<Input
					label={freight ? 'Weight per pallet (lbs)' : 'Weight per package (lbs)'}
					aria-label={`Weight for group ${index + 1} (lbs)`}
					name={field(`packageGroup.${group.id}.weight`)}
					type="number"
					min={0.001}
					max={maxWeight}
					step={0.001}
					required
					bind:value={
						() => String(group.weight ?? ''), (value) => (group.weight = String(value ?? ''))
					}
				/>
			</Card>
		{/each}
		<Div class="col-span-full flex justify-end"
			><Button
				variants={['small']}
				class="flex items-center gap-2"
				disabled={groups.length >= maxCount}
				onclick={addGroup}
				><Plus size={16} aria-hidden="true" />Add {freight ? 'pallet' : 'package'} group</Button
			></Div
		>
	{:else}
		<Input
			label={freight ? 'Pallet quantity' : 'Total Packages'}
			aria-label={freight ? 'Pallet quantity' : 'Total Packages'}
			name={field('packageInfoTotalPackages')}
			type="number"
			min={1}
			max={maxCount}
			step={1}
			required
			bind:value={
				() => String(totalPackages ?? ''), (value) => (totalPackages = String(value ?? ''))
			}
		/>
		{#if mode === 'total'}
			<Input
				label="Total Weight (lbs)"
				aria-label="Total Weight (lbs)"
				name={field('packageInfoTotalWeight')}
				type="number"
				min={0.001}
				step={0.001}
				required
				bind:value={() => String(totalWeight ?? ''), (value) => (totalWeight = String(value ?? ''))}
			/>
			{#if !simple && showSummary}<P class="col-span-full text-sm"
					>Total weight is distributed across {freight ? 'pallets' : 'packages'} for the estimate.</P
				>{/if}
		{:else}
			<Input
				label={freight ? 'Weight per pallet (lbs)' : 'Weight per package (lbs)'}
				aria-label={freight ? 'Weight per pallet (lbs)' : 'Weight per package (lbs)'}
				name={field('packageInfoPackageWeight')}
				type="number"
				min={0.001}
				max={maxWeight}
				step={0.001}
				required
				bind:value={() => String(eachWeight ?? ''), (value) => (eachWeight = String(value ?? ''))}
			/>
		{/if}
	{/if}
	{#if !simple && showSummary && mode !== 'cartons'}<P class="col-span-full" aria-live="polite"
			>{count}
			{freight ? (count === 1 ? 'pallet' : 'pallets') : count === 1 ? 'package' : 'packages'} · {Number(
				weight.toFixed(3)
			)} lbs total</P
		>{/if}
</Div>
