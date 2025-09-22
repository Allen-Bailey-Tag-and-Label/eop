<script lang="ts">
	import { Div, Form, Input, Select, SubmitButton } from '$lib/components';
	import { twMerge } from 'tailwind-merge';
	import Section from './Section.svelte';
	import Tr from './Tr.svelte';
	import type { Props } from './types';
	import type { SubmitFunction } from '@sveltejs/kit';

	let {
		_branchId = $bindable(''),
		current = $bindable({
			date: new Date().toISOString().split('T')[0],
			labor: '',
			margin: '',
			material: '',
			number: '',
			sell: '',
			totalCost: ''
		}),
		customerType = $bindable(''),
		data,
		isNumberAlreadySet = $bindable(false),
		previous = $bindable({
			date: '',
			labor: '',
			margin: '',
			material: '',
			number: '',
			sell: '',
			totalCost: ''
		}),
		productType = $bindable('')
	}: Props = $props();
	const customerTypeOptions = ['', 'direct', 'distributor'].map((label) => ({
		label,
		value: label
	}));
	let isLoading = $state(false);
	const productTypeOptions = ['', 'LB', 'TG', 'TG2', 'TG3', 'TGM'].map((label) => ({
		label,
		value: label
	}));
	const submitFunction: SubmitFunction = () => {
		isLoading = true;
		return async ({ update }) => {
			isLoading = false;
			await update();
		};
	};

	const _branchIdOptions = $derived.by(() =>
		data._branchIds.map((_branchId: any) => ({ label: _branchId.number, value: _branchId._id }))
	);

	$effect(() => {
		const currentLabor =
			Math.floor((Number(current.totalCost) - Number(current.material)) * 100) / 100;
		const previousLabor =
			Math.floor((Number(previous.totalCost) - Number(previous.material)) * 100) / 100;
		const previousMargin =
			Math.floor((Number(previous.sell) - Number(previous.totalCost)) * 100) / 100;

		if (!isNaN(currentLabor)) current.labor = currentLabor.toString();
		if (!isNaN(previousLabor)) previous.labor = previousLabor.toString();
		if (!isNaN(previousMargin)) previous.margin = previousMargin.toString();

		if (isNaN(currentLabor)) current.labor = '';
		if (isNaN(previousLabor)) previous.labor = '';
		if (isNaN(previousMargin)) previous.margin = '';
	});
	$effect(() => {
		if (data.locals.user.branches.length === 1) _branchId = data.locals.user.branches[0]._id;
	});
</script>

<Div class="flex flex-col items-start">
	<Form class="flex w-full max-w-none flex-col lg:w-auto" {submitFunction}>
		<Div class="flex flex-col gap-4 lg:flex-row lg:items-start">
			<Section title="Options">
				<Tr label="Branch">
					<Select
						bind:value={_branchId}
						class="w-full"
						name="_branchId"
						options={_branchIdOptions}
						required={true}
					/>
				</Tr>
				<Tr label="Customer Type">
					<Select
						bind:value={customerType}
						class="w-full"
						name="customerType"
						options={customerTypeOptions}
						required={true}
					/>
				</Tr>
				<Tr label="Product Type">
					<Select
						bind:value={productType}
						class="w-full"
						name="productType"
						options={productTypeOptions}
						required={true}
					/>
				</Tr>
			</Section>
			<Section title="Previous">
				<Tr label="Quote #">
					<Input
						bind:value={previous.number}
						class="w-full text-right"
						name="previous.number"
						required={true}
						type="number"
					/>
				</Tr>
				<Tr label="Date">
					<Input
						bind:value={previous.date}
						class="w-full"
						name="previous.date"
						required={true}
						type="date"
					/>
				</Tr>
				<Tr label="Material">
					<Input
						bind:value={previous.material}
						class="w-full text-right"
						name="previous.material"
						required={true}
						step={0.01}
						type="number"
					/>
				</Tr>
				<Tr label="Labor">
					<Input
						class="w-full text-right"
						name="previous.labor"
						readonly={true}
						step={0.01}
						tabindex={-1}
						type="number"
						value={previous.labor}
						variants={['readonly']}
					/>
				</Tr>
				<Tr label="Total Cost">
					<Input
						bind:value={previous.totalCost}
						class="w-full text-right"
						name="previous.totalCost"
						required={true}
						step={0.01}
						type="number"
					/>
				</Tr>
				<Tr
					label="Margin"
					percent={(Number(previous.sell) - Number(previous.totalCost)) / Number(previous.sell)}
				>
					<Input
						class="w-full text-right"
						name="previous.margin"
						readonly={true}
						step={0.01}
						tabindex={-1}
						type="number"
						value={previous.margin}
						variants={['readonly']}
					/>
				</Tr>
				<Tr label="Total Sell">
					<Input
						bind:value={previous.sell}
						class="w-full text-right"
						name="previous.sell"
						required={true}
						step={0.01}
						type="number"
					/>
				</Tr>
			</Section>
			<Section title="New">
				<Tr label="Quote #">
					<Input
						bind:value={current.number}
						class={twMerge(
							'w-full text-right',
							isNumberAlreadySet
								? 'bg-transparent shadow-none outline-0 hover:outline-0 focus:outline-0 dark:bg-transparent'
								: undefined
						)}
						name="current.number"
						readonly={isNumberAlreadySet ? true : undefined}
						required={true}
						tabindex={isNumberAlreadySet ? -1 : undefined}
						type="number"
					/>
				</Tr>
				<Tr label="Date">
					<Input
						bind:value={current.date}
						class="w-full"
						name="current.date"
						required={true}
						type="date"
					/>
				</Tr>
				<Tr label="Material">
					<Input
						bind:value={current.material}
						class="w-full text-right"
						name="current.material"
						required={true}
						step={0.01}
						type="number"
					/>
				</Tr>
				<Tr label="Labor">
					<Input
						class="w-full text-right"
						name="current.labor"
						readonly={true}
						step={0.01}
						tabindex={-1}
						type="number"
						value={current.labor}
						variants={['readonly']}
					/>
				</Tr>
				<Tr label="Total Cost">
					<Input
						bind:value={current.totalCost}
						class="w-full text-right"
						name="current.totalCost"
						required={true}
						step={0.01}
						type="number"
					/>
				</Tr>
				<Tr
					label="Margin"
					percent={(Number(current.sell) - Number(current.totalCost)) / Number(current.sell)}
				>
					<Input
						class="w-full text-right"
						name="current.margin"
						readonly={true}
						step={0.01}
						tabindex={-1}
						type="number"
						value={current.margin}
						variants={['readonly']}
					/>
				</Tr>
				<Tr label="Total Sell">
					<Input
						class="w-full text-right"
						name="current.sell"
						readonly={true}
						step={0.01}
						tabindex={-1}
						type="number"
						value={current.sell}
						variants={['readonly']}
					/>
				</Tr>
			</Section>
		</Div>
		{#snippet buttons()}
			<SubmitButton bind:isLoading class="self-end">Calculate</SubmitButton>
		{/snippet}
	</Form>
</Div>
