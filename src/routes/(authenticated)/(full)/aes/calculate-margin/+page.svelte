<script lang="ts">
	import { DateTime } from 'luxon';
	import { Button, Card, Div, Form, H3, Input, Select } from '$lib/components';
	import format from '$lib/format';
	import type { Quote } from './types';
	import { twMerge } from 'tailwind-merge';
	import { enhance } from '$app/forms';

	type Props = {
		quote: Quote;
		state: 'Calculate' | 'Update';
	};

	let {
		quote = $bindable({
			id: '',
			customerType: '',
			laborAmount: 0,
			previousLaborAmount: 0,
			previousMarginAmount: 0,
			previousMaterialAmount: 0,
			previousQuoteDate: DateTime.fromFormat('1969-12-31', 'yyyy-MM-dd').toJSDate(),
			previousQuoteNumber: 0,
			previousSellPrice: 0,
			previousTotalCostAmount: 0,
			marginAmount: 0,
			materialAmount: 0,
			productType: '',
			quoteDate: DateTime.fromFormat(
				DateTime.now().toFormat('yyyy-MM-dd'),
				'yyyy-MM-dd'
			).toJSDate(),
			quoteNumber: 0,
			totalCostAmount: 0,
			type: 'have-aes-quote',
			sellPrice: 0
		}),
		state = $bindable('Calculate')
	}: Props = $props();

	const customerTypeOptions = ['', 'Direct', 'Distributor'].map((label) => ({
		label,
		value: label.toLowerCase()
	}));
	const enhanceHandler = () => {
		return async ({ result, update }: { result: any; update: any }) => {
			if (result?.data?.quote !== undefined) {
				quote = result.data.quote;
			}
			if (result?.data?.quote === undefined) {
				update();
			}
		};
	};
	const productTypeOptions = ['', 'LB', 'TG', 'TGM', 'TG2', 'TG3'].map((label) => ({
		label,
		value: label
	}));
	const requiredQuoteKeys = [
		'customerType',
		'previousMaterialAmount',
		'previousQuoteDate',
		'previousQuoteNumber',
		'previousSellPrice',
		'previousTotalCostAmount',
		'materialAmount',
		'productType',
		'quoteDate',
		'quoteNumber',
		'totalCostAmount'
	];

	// $derives
	const formFinished = $derived(
		Object.keys(quote).filter(
			(key) => requiredQuoteKeys.includes(key) && (quote[key] === '' || quote[key] === 0)
		).length === 0
	);
	const previousDateTooEarly = $derived(
		DateTime.fromJSDate(quote.previousQuoteDate) < DateTime.fromFormat('2013-01-01', 'yyyy-MM-dd')
	);
	const newDateTooEarly = $derived(
		DateTime.fromJSDate(quote.quoteDate) < DateTime.fromJSDate(quote.previousQuoteDate)
	);
	const previousTotalCostTooLow = $derived(
		quote.previousTotalCostAmount < quote.previousMaterialAmount
	);
	const newTotalCostTooLow = $derived(quote.totalCostAmount < quote.materialAmount);
	const formDisabled = $derived(
		!formFinished ||
			previousDateTooEarly ||
			newDateTooEarly ||
			previousTotalCostTooLow ||
			newTotalCostTooLow
	);
</script>

<Div class="flex flex-grow flex-col overflow-auto lg:items-center lg:justify-center">
	<Form
		class="flex flex-grow flex-col space-y-0 overflow-auto lg:flex-grow-0 lg:space-y-4 lg:overflow-visible"
		disabled={formDisabled}
		use={[[enhance, enhanceHandler]]}
	>
		<Div
			class="flex flex-col space-y-4 overflow-auto p-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0 lg:overflow-visible lg:p-0"
		>
			<Div class="flex flex-col justify-between space-y-4">
				<Card class="space-y-8">
					<H3>Options</H3>
					<Div class="grid grid-cols-[fit-content(0px)_1fr] items-center gap-x-2 gap-y-1">
						{@render Label('Customer Type')}
						<Select
							bind:value={quote.customerType}
							name="customerType"
							options={customerTypeOptions}
							required
						/>
						{@render Label('Product Type')}
						<Select
							bind:value={quote.productType}
							name="type"
							options={productTypeOptions}
							required
						/>
					</Div>
				</Card>
				{@render Highlight('hidden lg:flex')}
			</Div>
			<Card class="space-y-8">
				<H3>Previous</H3>
				<Div class="grid grid-cols-[fit-content(0px)_1fr] items-center gap-x-2 gap-y-1">
					{@render Label('Quote #')}
					<Input
						bind:value={quote.previousQuoteNumber}
						class="text-right"
						name="previousQuoteNumber"
						required
						type="number"
					/>
					{@render Label('Date')}
					<Input
						bind:value={() => {
							const string = DateTime.fromJSDate(quote.previousQuoteDate).toFormat('yyyy-MM-dd');
							if (string === '1969-12-31') return '';
							return string;
						},
						(string) => {
							if (string === '') return new Date(0);
							const newDate = DateTime.fromFormat(string, 'yyyy-MM-dd').toJSDate();
							quote.previousQuoteDate = newDate;
							return newDate;
						}}
						class="text-right"
						name="previousQuoteDate"
						required
						type="date"
						variants={previousDateTooEarly || newDateTooEarly ? ['default', 'error'] : ['default']}
					/>
					{@render Label('Material Cost')}
					<Input
						bind:value={quote.previousMaterialAmount}
						class="text-right"
						name="previousMaterialAmount"
						required
						min="0"
						step=".01"
						type="number"
						variants={previousTotalCostTooLow ? ['default', 'error'] : ['default']}
					/>
					{@render Label('Labor Cost')}
					<Input
						class={twMerge(
							'bg-transparent text-right ring-0 ring-offset-0 hover:bg-transparent focus:bg-transparent dark:bg-transparent',
							state === 'Calculate' ? 'opacity-0' : 'opacity-100'
						)}
						name="previousLaborAmount"
						disabled
						required
						min="0"
						step=".01"
						type="number"
						value={format
							.float(quote.previousTotalCostAmount - +quote.previousMaterialAmount)
							.toString()}
					/>
					{@render Label('Total Cost')}
					<Input
						bind:value={quote.previousTotalCostAmount}
						class="text-right"
						name="previousTotalCostAmount"
						required
						min="0"
						step=".01"
						type="number"
						variants={previousTotalCostTooLow ? ['default', 'error'] : ['default']}
					/>
					{@render Label('Margin')}
					<Input
						class={twMerge(
							'bg-transparent text-right ring-0 ring-offset-0 hover:bg-transparent focus:bg-transparent dark:bg-transparent',
							state === 'Calculate' ? 'opacity-0' : 'opacity-100'
						)}
						name="previousMarginAmount"
						disabled
						required
						min="0"
						step=".01"
						type="number"
						value={format
							.float(quote.previousSellPrice - +quote.previousTotalCostAmount)
							.toString()}
					/>
					{@render Label('Total Price')}
					<Input
						bind:value={quote.previousSellPrice}
						class="text-right"
						name="previousSellPrice"
						required
						min="0"
						step=".01"
						type="number"
					/>
				</Div>
			</Card>
			<Card class="space-y-8">
				<H3>New</H3>
				<Div class="grid grid-cols-[fit-content(0px)_1fr] items-center gap-x-2 gap-y-1">
					{@render Label('Quote #')}
					<Input
						bind:value={quote.quoteNumber}
						class="text-right"
						name="quoteNumber"
						required
						type="number"
					/>
					{@render Label('Date')}
					<Input
						bind:value={() => {
							return DateTime.fromJSDate(quote.quoteDate).toFormat('yyyy-MM-dd');
						},
						(string) => {
							const newDate = DateTime.fromFormat(string, 'yyyy-MM-dd').toJSDate();
							quote.quoteDate = newDate;
							return newDate;
						}}
						class="text-right"
						name="quoteDate"
						required
						type="date"
						variants={newDateTooEarly ? ['default', 'error'] : ['default']}
					/>
					{@render Label('Material Cost')}
					<Input
						bind:value={quote.materialAmount}
						class="text-right"
						name="materialAmount"
						required
						min="0"
						step=".01"
						type="number"
						variants={newTotalCostTooLow ? ['default', 'error'] : ['default']}
					/>
					{@render Label('Labor Cost')}
					<Input
						class={twMerge(
							'bg-transparent text-right ring-0 ring-offset-0 hover:bg-transparent focus:bg-transparent dark:bg-transparent',
							state === 'Calculate' ? 'opacity-0' : 'opacity-100'
						)}
						name="laborAmount"
						disabled
						required
						min="0"
						step=".01"
						type="number"
						value={format.float(quote.totalCostAmount - +quote.materialAmount).toString()}
					/>
					{@render Label('Total Cost')}
					<Input
						bind:value={quote.totalCostAmount}
						class="text-right"
						name="totalCostAmount"
						required
						min="0"
						step=".01"
						type="number"
						variants={newTotalCostTooLow ? ['default', 'error'] : ['default']}
					/>
					{@render Label('Margin')}
					<Input
						class={twMerge(
							'bg-transparent text-right ring-0 ring-offset-0 hover:bg-transparent focus:bg-transparent dark:bg-transparent',
							state === 'Calculate' ? 'opacity-0' : 'opacity-100'
						)}
						name="marginAmount"
						disabled
						required
						min="0"
						step=".01"
						type="number"
						value={format.float(quote.sellPrice - +quote.totalCostAmount).toString()}
					/>
					{@render Label('Total Price')}
					<Input
						class={twMerge(
							'bg-transparent text-right ring-0 ring-offset-0 hover:bg-transparent focus:bg-transparent dark:bg-transparent',
							state === 'Calculate' ? 'opacity-0' : 'opacity-100'
						)}
						name="marginAmount"
						disabled
						required
						min="0"
						step=".01"
						type="number"
						value={format.float(quote.sellPrice).toString()}
					/>
				</Div>
			</Card>
			{@render Highlight('flex lg:hidden')}
		</Div>
		<Card
			class="rounded-none bg-transparent p-4 lg:flex-row lg:justify-end lg:p-0 lg:shadow-none lg:ring-0 dark:bg-transparent lg:dark:shadow-none"
		>
			<Button disabled={formDisabled} type="submit">{state}</Button>
		</Card>
	</Form>
</Div>

{#snippet Label(label: string)}
	<Div class="whitespace-nowrap font-semibold">{label}</Div>
{/snippet}

{#snippet Highlight(className?: string)}
	<Div
		class={twMerge(
			'flex-col space-y-4',
			className,
			state === 'Calculate' ? 'hidden lg:hidden' : undefined
		)}
	>
		<Card
			class={twMerge(
				'flex-row justify-between bg-gradient-to-br',
				quote.marginAmount < 0
					? 'from-red-500 to-red-600 text-white selection:bg-white selection:text-red-500'
					: 'from-yellow-400 to-yellow-500 text-black selection:bg-black selection:text-yellow-500'
			)}
		>
			{@render Label('Margin')}
			<Div class="text-right">
				{format.percent(quote.marginAmount / quote.sellPrice)}
			</Div>
		</Card>
		<Card
			class={twMerge(
				'flex-row justify-between bg-gradient-to-br',
				quote.marginAmount < 0
					? 'from-red-500 to-red-600 text-white selection:bg-white selection:text-red-500'
					: 'from-yellow-400 to-yellow-500 text-black selection:bg-black selection:text-yellow-500'
			)}
		>
			{@render Label('Total Price')}
			<Div class="text-right">
				{format.currency(quote.sellPrice)}
			</Div>
		</Card>
	</Div>
{/snippet}
