<script lang="ts">
	import { Button, Card, Div, H3, Input, Select, Checkbox, P } from '$lib/components';
	import { Copy, Plus, Trash2 } from '@lucide/svelte';
	import {
		FREIGHT_CLASSES,
		blankPackage,
		blankFreight,
		type PackageGroup,
		type FreightItem
	} from '../types';
	let { items = $bindable(), freight = false }: { items: PackageGroup[]; freight?: boolean } =
		$props();
	const prefix = $derived(freight ? 'freight' : 'package');
	const numberFields = [
		{ key: 'quantity', label: 'Quantity' },
		{ key: 'weight', label: 'Weight each (lb)' },
		{ key: 'length', label: 'Length (in)' },
		{ key: 'width', label: 'Width (in)' },
		{ key: 'height', label: 'Height (in)' }
	] as const;
</script>

<Div class="col-span-full min-w-0 space-y-4">
	<H3 class="text-base">{freight ? 'LTL freight' : 'UPS packages'}</H3>
	<P
		>{freight
			? 'Enter each pallet or handling unit including its packaging. Weight and dimensions are per unit.'
			: 'Group identical cartons together. Weight and dimensions are per carton.'}</P
	>
	{#each items as item, index (item.id)}
		<Card class="min-w-0 space-y-4 p-4">
			<Input type="hidden" name={`${prefix}Id`} value={item.id} />
			<Div class="flex items-center justify-between gap-4"
				><H3 class="text-base">{freight ? 'Freight item' : 'Package group'} {index + 1}</H3><Div
					class="flex gap-2"
				>
					<Button
						variants={['ghost', 'icon']}
						disabled={items.length >= 50}
						aria-label={`Duplicate ${prefix} ${index + 1}`}
						onclick={() => (items = [...items, { ...item, id: crypto.randomUUID() }])}
						><Copy size={18} aria-hidden="true" /></Button
					>
					<Button
						variants={['ghost', 'icon']}
						disabled={items.length === 1}
						aria-label={`Remove ${prefix} ${index + 1}`}
						onclick={() => (items = items.filter((row) => row.id !== item.id))}
						><Trash2 size={18} aria-hidden="true" /></Button
					></Div
				></Div
			>
			<Div class="grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-3">
				{#each numberFields as field (field.key)}
					<Input
						type="number"
						label={field.label}
						aria-label={`${freight ? 'Freight item' : 'Package group'} ${index + 1} ${field.label}`}
						name={`${prefix}.${item.id}.${field.key}`}
						value={Number.isFinite(item[field.key]) ? String(item[field.key]) : ''}
						oninput={(event) => (item[field.key] = event.currentTarget.valueAsNumber)}
						min={field.key === 'quantity' ? 1 : 0.01}
						step={field.key === 'quantity' ? 1 : 0.01}
						required
					/>
				{/each}
			</Div>
			{#if freight}
				{@const cargo = item as FreightItem}
				<Input
					label="Commodity description"
					name={`${prefix}.${item.id}.description`}
					bind:value={cargo.description}
					maxlength={200}
					required
				/>
				<Div class="grid gap-4 md:grid-cols-2">
					<Select
						label="Freight class"
						name={`${prefix}.${item.id}.freightClass`}
						bind:value={cargo.freightClass}
						options={[
							{ value: '', label: 'Select class' },
							...FREIGHT_CLASSES.map((value) => ({ value, label: value }))
						]}
						required
					/>
					<Input
						label="NMFC code (if known)"
						name={`${prefix}.${item.id}.nmfc`}
						bind:value={cargo.nmfc}
						maxlength={40}
					/>
				</Div>
				<Checkbox
					label="Stackable"
					name={`${prefix}.${item.id}.stackable`}
					bind:checked={cargo.stackable}
				/>
			{/if}
		</Card>
	{/each}
	<P aria-live="polite"
		>{items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}
		{freight ? 'handling units' : 'packages'} · {items
			.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.weight) || 0), 0)
			.toLocaleString(undefined, { maximumFractionDigits: 2 })} lb total</P
	>
	<Div class="flex justify-end"
		><Button
			variants={['small']}
			class="flex items-center gap-2"
			disabled={items.length >= 50}
			onclick={() => (items = [...items, freight ? blankFreight() : blankPackage()])}
			><Plus size={16} aria-hidden="true" />Add {freight ? 'freight item' : 'package group'}</Button
		></Div
	>
</Div>
