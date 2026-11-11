<script lang="ts">
	import { Button, Card, Div, Input, P, Tabs } from '$lib/components';
	import { Plus, Trash2 } from '@lucide/svelte';
	import { MAX_QUOTE_PACKAGES, type PackageGroupInput, type WeightMode } from './quote';
	type Props = {
		mode?: WeightMode;
		totalPackages?: string;
		totalWeight?: string;
		eachWeight?: string;
		groups?: PackageGroupInput[];
	};
	let {
		mode = $bindable('total'),
		totalPackages = $bindable(''),
		totalWeight = $bindable(''),
		eachWeight = $bindable(''),
		groups = $bindable([])
	}: Props = $props();
	const count = $derived(
		mode === 'groups'
			? groups.reduce((sum, group) => sum + (Number(group.quantity) || 0), 0)
			: Number(totalPackages) || 0
	);
	const weight = $derived(
		mode === 'groups'
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
	<Tabs
		class="col-span-full"
		aria-label="Package weight entry"
		value={mode}
		onValueChange={select}
		tabs={[
			{ title: 'Total weight', value: 'total' },
			{ title: 'Per package', value: 'each' },
			{ title: 'Different weights', value: 'groups' }
		]}
	/>
	<Input type="hidden" name="weightMode" value={mode} />
	{#if mode === 'groups'}
		<Input
			type="hidden"
			name="packageGroups"
			value={JSON.stringify(groups.map(({ quantity, weight }) => ({ quantity, weight })))}
		/>
		{#each groups as group, index (group.id)}
			<Card class="col-span-full grid min-w-0 grid-cols-subgrid gap-y-4 p-4">
				<Div class="col-span-full flex items-center justify-between gap-4"
					><P class="font-semibold">Package group {index + 1}</P><Button
						variants={['ghost', 'icon']}
						aria-label={`Remove package group ${index + 1}`}
						disabled={groups.length === 1}
						onclick={() => (groups = groups.filter((item) => item.id !== group.id))}
						><Trash2 size={18} aria-hidden="true" /></Button
					></Div
				>
				<Input
					label="Quantity"
					aria-label={`Quantity for group ${index + 1}`}
					name={`packageGroup.${group.id}.quantity`}
					type="number"
					min={1}
					max={MAX_QUOTE_PACKAGES}
					step={1}
					required
					bind:value={group.quantity}
				/>
				<Input
					label="Weight per package (lbs)"
					aria-label={`Weight for group ${index + 1} (lbs)`}
					name={`packageGroup.${group.id}.weight`}
					type="number"
					min={0.001}
					max={150}
					step={0.001}
					required
					bind:value={group.weight}
				/>
			</Card>
		{/each}
		<Div class="col-span-full flex justify-end"
			><Button
				variants={['small']}
				class="flex items-center gap-2"
				disabled={groups.length >= MAX_QUOTE_PACKAGES}
				onclick={addGroup}><Plus size={16} aria-hidden="true" />Add package group</Button
			></Div
		>
	{:else}
		<Input
			label="Total Packages"
			aria-label="Total Packages"
			name="packageInfoTotalPackages"
			type="number"
			min={1}
			max={MAX_QUOTE_PACKAGES}
			step={1}
			required
			bind:value={totalPackages}
		/>
		{#if mode === 'total'}
			<Input
				label="Total Weight (lbs)"
				aria-label="Total Weight (lbs)"
				name="packageInfoTotalWeight"
				type="number"
				min={0.001}
				step={0.001}
				required
				bind:value={totalWeight}
			/>
			<P class="col-span-full text-sm"
				>Total weight is divided evenly between packages for the estimate.</P
			>
		{:else}
			<Input
				label="Weight per package (lbs)"
				aria-label="Weight per package (lbs)"
				name="packageInfoPackageWeight"
				type="number"
				min={0.001}
				max={150}
				step={0.001}
				required
				bind:value={eachWeight}
			/>
		{/if}
	{/if}
	<P class="col-span-full" aria-live="polite"
		>{count} {count === 1 ? 'package' : 'packages'} · {Number(weight.toFixed(3))} lbs total</P
	>
</Div>
