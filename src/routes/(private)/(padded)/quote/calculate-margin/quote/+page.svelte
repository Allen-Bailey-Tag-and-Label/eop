<script lang="ts">
	import { Button, Div, Form, Input, Select } from '$lib/components';
	import { twMerge } from 'tailwind-merge';
	import Section from './Section.svelte';
	import Tr from './Tr.svelte';
	import type { Props } from './types';
	import { percent } from '$lib/formats';

	let {
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
	const productTypeOptions = ['', 'LB', 'TG', 'TG2', 'TG3', 'TGM'].map((label) => ({
		label,
		value: label
	}));
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
</script>

<Div class="flex flex-col items-start">
	<Form class="flex w-auto max-w-none flex-col">
		<Div class="flex items-start gap-4">
			<Section title="Options">
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
						class="text-right"
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
						class="text-right"
						name="previous.material"
						required={true}
						type="number"
					/>
				</Tr>
				<Tr label="Labor">
					<Input
						class="bg-transparent text-right outline-0 hover:outline-0 focus:outline-0 dark:bg-transparent"
						name="previous.labor"
						readonly={true}
						tabindex={-1}
						type="number"
						value={previous.labor}
					/>
				</Tr>
				<Tr label="Total Cost">
					<Input
						bind:value={previous.totalCost}
						class="text-right"
						name="previous.totalCost"
						required={true}
						type="number"
					/>
				</Tr>
				<Tr
					label="Margin"
					percent={(Number(previous.sell) - Number(previous.totalCost)) / Number(previous.sell)}
				>
					<Input
						class="bg-transparent text-right outline-0 hover:outline-0 focus:outline-0 dark:bg-transparent"
						name="previous.margin"
						readonly={true}
						tabindex={-1}
						type="number"
						value={previous.margin}
					/>
				</Tr>
				<Tr label="Total Sell">
					<Input
						bind:value={previous.sell}
						class="text-right"
						name="previous.sell"
						required={true}
						type="number"
					/>
				</Tr>
			</Section>
			<Section title="New">
				<Tr label="Quote #">
					<Input
						bind:value={current.number}
						class={twMerge(
							'text-right',
							isNumberAlreadySet
								? 'bg-transparent outline-0 hover:outline-0 focus:outline-0 dark:bg-transparent'
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
						class="text-right"
						name="current.material"
						required={true}
						type="number"
					/>
				</Tr>
				<Tr label="Labor">
					<Input
						class="bg-transparent text-right outline-0 hover:outline-0 focus:outline-0 dark:bg-transparent"
						name="current.labor"
						readonly={true}
						tabindex={-1}
						type="number"
						value={current.labor}
					/>
				</Tr>
				<Tr label="Total Cost">
					<Input
						bind:value={current.totalCost}
						class="text-right"
						name="current.totalCost"
						required={true}
						type="number"
					/>
				</Tr>
				<Tr
					label="Margin"
					percent={(Number(current.sell) - Number(current.totalCost)) / Number(current.sell)}
				>
					<Input
						class="bg-transparent text-right outline-0 hover:outline-0 focus:outline-0 dark:bg-transparent"
						name="current.margin"
						readonly={true}
						tabindex={-1}
						type="number"
						value={current.margin}
					/>
				</Tr>
				<Tr label="Total Sell">
					<Input
						class="bg-transparent text-right outline-0 hover:outline-0 focus:outline-0 dark:bg-transparent"
						name="current.sell"
						readonly={true}
						tabindex={-1}
						type="number"
						value={current.sell}
					/>
				</Tr>
			</Section>
		</Div>
		{#snippet buttons()}
			<Button class="self-end" type="submit">Calculate</Button>
		{/snippet}
	</Form>
</Div>
