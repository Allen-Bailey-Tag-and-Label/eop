<script lang="ts">
	import {
		Button,
		Card,
		Div,
		Input,
		P,
		Select,
		Table,
		Tbody,
		Td,
		Th,
		Thead,
		Tr
	} from '$lib/components';
	import * as formats from '$lib/formats';
	import { ChevronRight } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let conversionFactor: number = $state(1);
	let currentDate: Date | null = $state(new Date());
	const getMonthsBetweenDates = (date1: Date | null, date2: Date | null): number => {
		if (date1 === null || date2 === null) return 0;
		if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 0;

		const start = date1 < date2 ? date1 : date2;
		const end = date1 < date2 ? date2 : date1;

		return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
	};
	let previousDate: Date | null = $state(null);
	let rows = $state(new Array(10).fill({ cost: 0, quantity: 0, sell: 0 }));
	let stepIndex = $state(0);
	const steps: { snippet: Snippet; title: string }[] = $state([
		{ snippet: dateSnippet, title: 'Date' },
		{ snippet: uomSnippet, title: 'UOM' },
		{ snippet: uomConversionSnippet, title: 'UOM Conversion' },
		{ snippet: quantitiesSnippet, title: 'Quantities' }
	]);
	let uom = $state('EA');
	let uomOptions = ['CN', 'EA', 'RL'].map((label) => ({ label, value: label }));

	// $derives
	const monthsBetweenDates = $derived.by(() => getMonthsBetweenDates(previousDate, currentDate));
	const sells = $derived.by(() => {
		const desiredMargin = 0.35;
		const minimumAnnualIncrease = 0.03;
		const maximumAnnualIncrease = 0.12;

		return rows.map(({ cost, sell }) => {
			const desiredSell = cost / (1 - desiredMargin);
			const minimumSell =
				sell * Math.pow(Math.pow(1 + minimumAnnualIncrease, 1 / 12), monthsBetweenDates);
			const maximumSell =
				sell * Math.pow(Math.pow(1 + maximumAnnualIncrease, 1 / 12), monthsBetweenDates);

			return Math.max(Math.min(desiredSell, maximumSell), minimumSell);
		});
	});
</script>

<Div class="flex flex-col items-start">
	<Div class="flex flex-col space-y-6">
		<Div class="flex items-center border-b border-white/[.5] pb-6 dark:border-white/[.025]">
			{#each steps as { title }, i}
				<Button onclick={() => (stepIndex = i)} variants={stepIndex === i ? undefined : ['ghost']}>
					{title}
				</Button>
				{#if i < steps.length - 1}
					<ChevronRight />
				{/if}
			{/each}
		</Div>
		{@render steps[stepIndex].snippet()}
		<Div class="flex justify-between border-t border-white/[.5] pt-6 pb-6 dark:border-white/[.025]">
			<Button
				disabled={stepIndex === 0 ? true : undefined}
				onclick={() => {
					stepIndex--;
				}}
				variants={stepIndex === 0 ? ['ghost'] : undefined}
			>
				Previous
			</Button>
			<Button
				disabled={stepIndex === steps.length - 1 ? true : undefined}
				onclick={() => {
					stepIndex++;
					if (steps[stepIndex].snippet === uomConversionSnippet && uom === 'EA') {
						conversionFactor = 1;
						stepIndex++;
					}
				}}
			>
				Next
			</Button>
		</Div>
	</Div>
</Div>

{#snippet dateSnippet()}
	<Div class="flex flex-col items-start space-y-4">
		<P>What date was the previous quote done on?</P>
		<Input
			bind:value={
				() => {
					if (previousDate === null) return '';
					return formats.inputDate(previousDate);
				},
				(string) => {
					const date = new Date(string);
					if (isNaN(date.getTime())) {
						previousDate = null;
						return;
					}
					previousDate = date;
				}
			}
			required={true}
			type="date"
		/>
	</Div>
{/snippet}
{#snippet uomSnippet()}
	<Div class="flex flex-col items-start space-y-4">
		<P>What unit of measure would you like to work with?</P>
		<Select bind:value={uom} options={uomOptions} required={true} />
	</Div>
{/snippet}
{#snippet uomConversionSnippet()}
	<Div class="flex flex-col items-start space-y-4">
		<P>How many "EA" in a "{uom}"?</P>
		<Input
			bind:value={
				() => {
					return conversionFactor.toString();
				},
				(string) => {
					const number = parseInt(string);
					if (isNaN(number)) {
						conversionFactor = 1;
						return;
					}
					conversionFactor = number;
				}
			}
			class="text-right"
			required={true}
			type="number"
		/>
	</Div>
{/snippet}
{#snippet quantitiesSnippet()}
	<Div class="flex flex-col items-start space-y-4">
		<P>Fill in the information below for each quantity.</P>
		<Table>
			<Thead>
				<Th>Quantity ({uom})</Th>
				<Th>Previous Price</Th>
				<Th>Current Total Cost</Th>
				<Th>Proposed Sell</Th>
			</Thead>
			<Tbody>
				{#each rows as _, rowIndex}
					<Tr>
						<Td class="p-0">
							<Input
								bind:value={rows[rowIndex].quantity}
								class="rounded-none bg-transparent text-right shadow-none backdrop-blur-none dark:bg-transparent dark:shadow-none"
								required={true}
								type="number"
							/>
						</Td>
						<Td class="p-0">
							<Input
								bind:value={rows[rowIndex].sell}
								class="rounded-none bg-transparent text-right shadow-none backdrop-blur-none dark:bg-transparent dark:shadow-none"
								required={true}
								step={0.01}
								type="number"
							/>
						</Td>
						<Td class="p-0">
							<Input
								bind:value={rows[rowIndex].cost}
								class="rounded-none bg-transparent text-right shadow-none backdrop-blur-none dark:bg-transparent dark:shadow-none"
								required={true}
								step={0.01}
								type="number"
							/>
						</Td>
						<Td class="text-right">
							{sells[rowIndex].toFixed(2)}
						</Td>
					</Tr>
				{/each}
			</Tbody>
		</Table>
	</Div>
{/snippet}
<!-- <Div class="flex items-start justify-start space-x-4">
	<Card class="space-y-4">
		<Input
			bind:value={
				() => {
					if (previousDate === null) return '';
					return formats.inputDate(previousDate);
				},
				(string) => {
					const date = new Date(string);
					if (isNaN(date.getTime())) {
						previousDate = null;
						return;
					}
					previousDate = date;
				}
			}
			label="Previous Date"
			required={true}
			type="date"
		/>
		<Input
			bind:value={
				() => {
					if (currentDate === null) return '';
					return formats.inputDate(currentDate);
				},
				(string) => {
					const date = new Date(string);
					if (isNaN(date.getTime())) {
						currentDate = null;
						return;
					}
					currentDate = date;
				}
			}
			label="Current Date"
			required={true}
			type="date"
		/>
	</Card>
	<Card class="space-y-4">
		<Select bind:value={uom} label="UOM" options={uomOptions} required={true} />
		<Input
			bind:value={
				() => {
					return conversionFactor.toString();
				},
				(string) => {
					const number = parseInt(string);
					if (isNaN(number)) {
						conversionFactor = 1;
						return;
					}
					conversionFactor = number;
				}
			}
			class="text-right"
			label={`EA in a ${uom}`}
			required={true}
			type="number"
		/>
	</Card>
	<Card class="p-0">
		<Div class="overflow-hidden rounded-lg">
			<Table>
				<Thead>
					<Th>Quantity</Th>
					<Th>Previous Price</Th>
					<Th>Current Total Cost</Th>
					<Th>Proposed Sell</Th>
				</Thead>
				<Tbody>
					{#each rows as _, rowIndex}
						<Tr>
							<Td class="p-0">
								<Input
									bind:value={rows[rowIndex].quantity}
									class="rounded-none bg-transparent text-right shadow-none backdrop-blur-none dark:bg-transparent dark:shadow-none"
									required={true}
									type="number"
								/>
							</Td>
							<Td class="p-0">
								<Input
									bind:value={rows[rowIndex].sell}
									class="rounded-none bg-transparent text-right shadow-none backdrop-blur-none dark:bg-transparent dark:shadow-none"
									required={true}
									step={0.01}
									type="number"
								/>
							</Td>
							<Td class="p-0">
								<Input
									bind:value={rows[rowIndex].cost}
									class="rounded-none bg-transparent text-right shadow-none backdrop-blur-none dark:bg-transparent dark:shadow-none"
									required={true}
									step={0.01}
									type="number"
								/>
							</Td>
							<Td class="text-right">
								{sells[rowIndex].toFixed(2)}
							</Td>
						</Tr>
					{/each}
				</Tbody>
			</Table>
		</Div>
	</Card>
</Div> -->
