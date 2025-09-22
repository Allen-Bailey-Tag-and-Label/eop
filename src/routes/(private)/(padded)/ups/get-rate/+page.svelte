<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import {
		Button,
		Card,
		Div,
		Form,
		Input,
		SubmitButton,
		Table,
		Tbody,
		Td,
		Th,
		Thead,
		Tr
	} from '$lib/components';
	import FormSections from '../quote/FormSections.svelte';
	import { slide } from 'svelte/transition';
	import type { RatedShipment } from './types';
	import { currency, dateTime } from '$lib/formats';
	import { is } from '$lib/is';

	let formData = $state({
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
	});
	let isLoading = $state(false);
	let date = $state(new Date());
	let rates: RatedShipment[] = $state([]);
	const reset = () => {
		formData = {
			shipFrom: {
				address: '',
				city: '',
				state: '',
				zip: ''
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
		};
	};
	const serviceCodeMap = new Map([
		['03', 'Ground'],
		['12', '3 Day Select'],
		['02', '2nd Day Air'],
		['59', '2nd Day Air A.M.'],
		['13', 'Next Day Air Saver'],
		['01', 'Next Day Air'],
		['14', 'Next Day Air Early'],
		['75', 'Heavy Goods']
	]);
	const submitFunction: SubmitFunction = () => {
		isLoading = true;
		return async ({ result, update }) => {
			isLoading = false;
			console.log(result);
			if (result.type === 'success') {
				date = new Date();
				rates = result.data.sort(
					(a, b) =>
						Number(a.TransportationCharges.MonetaryValue) -
						Number(b.TransportationCharges.MonetaryValue)
				);
			}
		};
	};

	const packageWeight = $derived.by(() =>
		Math.ceil(
			Number(formData.packageInfo.totalWeight) / Number(formData.packageInfo.totalPackages)
		).toString()
	);
</script>

<Div class="flex flex-col space-y-6 lg:items-start">
	{#if rates.length === 0}
		<Form class="flex w-auto max-w-none flex-col lg:items-end" {submitFunction}>
			<FormSections bind:formData isValidationCheckboxRequired={false} />
			<Input
				class="sr-only absolute top-0 left-0 h-0 w-0"
				name="packageWeight"
				type="hidden"
				value={packageWeight}
			/>
			<Div class="flex justify-end space-x-2">
				{#if !isLoading}
					<div transition:slide={{ axis: 'y' }}>
						<Button onclick={reset} variants={['glass']}>Reset</Button>
					</div>
				{/if}
				<SubmitButton bind:isLoading>Get Rate</SubmitButton>
			</Div>
		</Form>
	{:else}
		<Div class="flex flex-col space-y-6 lg:items-start">
			<Div class="grid grid-cols-[fit-content(0px)_fit-content(0px)] gap-x-2">
				{@render detail('Date', dateTime(date))}
				{@render detail(
					'Ship From',
					`${formData.shipFrom.address}, ${formData.shipFrom.city}, ${formData.shipFrom.state} ${formData.shipFrom.zip}`
				)}
				{@render detail(
					'Ship To',
					`${formData.shipTo.address}, ${formData.shipTo.city}, ${formData.shipTo.state} ${formData.shipTo.zip}`
				)}
				{@render detail('Total Packages', formData.packageInfo.totalPackages)}
				{@render detail('Total Weight', formData.packageInfo.totalWeight)}
			</Div>
			<Card class="rounded-none p-0">
				<Table>
					<Thead>
						<Tr>
							<Th>Description</Th>
							<Th class="text-right">Published Rate</Th>
						</Tr>
					</Thead>
					<Tbody>
						{#each rates.filter((rate) => is.object(rate)) as { Service, TransportationCharges }}
							<Tr>
								<Td>{serviceCodeMap.get(Service.Code)}</Td>
								<Td class="text-right">
									{currency(
										Number(TransportationCharges.MonetaryValue) *
											Number(formData.packageInfo.totalPackages)
									)}
								</Td>
							</Tr>
						{/each}
					</Tbody>
				</Table>
			</Card>
			<Div class="flex w-full justify-end">
				<Button
					onclick={() => {
						rates = [];
					}}
				>
					New Rate
				</Button>
			</Div>
		</Div>
	{/if}
</Div>

{#snippet detail(label: string, value: any)}
	<Div class="font-bold whitespace-nowrap">{label}:</Div>
	<Div class="whitespace-nowrap">{value}</Div>
{/snippet}
