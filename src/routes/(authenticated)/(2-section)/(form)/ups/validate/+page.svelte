<script lang="ts">
	import { states } from 'states-us';
	import zipcodes from 'zipcodes';
	import { scale } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { enhance } from '$app/forms';
	import {
		Button,
		Div,
		Fieldset,
		Form,
		H1,
		Input,
		P,
		ProgressIndicator,
		Select,
		Table,
		Tbody,
		Td,
		Tr
	} from '$lib/components';
	import type { Result } from './types';
	import { twMerge } from 'tailwind-merge';

	type Info = {
		address: string;
		city: string;
		state: string;
		zip: string;
	};
	let disabled: boolean = $state(false);
	const enhanceHandler = async () => {
		disabled = true;
		return async ({ result: { data } }: { result: { data: Result } }) => {
			result = { ...data, info: structuredClone($state.snapshot(info)) };
			disabled = false;
			info = {
				address: '',
				city: '',
				state: '',
				zip: ''
			};
		};
	};
	let info: Info = $state({
		address: '',
		city: '',
		state: '',
		zip: ''
	});
	let result: null | (Result & { info: Info }) = $state(null);
	const stateOptions = states.map((state) => ({
		label: state.abbreviation,
		value: state.abbreviation
	}));
	const statusMap = new Map([
		['ambiguousAddress', 'Multiple Candidates'],
		['noCandidates', 'No Possible Candidiates'],
		['validAddress', 'Valid']
	]);

	// $derives
	const stats = $derived.by(() => {
		if (result === null) return new Map();
		const stats = new Map([
			['Address', result.info.address],
			['City', result.info.city],
			['State', result.info.state],
			['ZIP', result.info.zip]
		]);
		if (result.indicator === 'ambiguousAddress') stats.set('Result', 'Multiple Candidates Found');
		if (result.indicator === 'noCandidates') stats.set('Result', 'No Candidates Found');
		if (result.indicator === 'validAddress') stats.set('Result', 'Valid Address');

		return stats;
	});
</script>

<Div class="flex flex-col space-y-8">
	<Div class="flex flex-col items-center space-y-2">
		<H1>UPS Validate ✔️</H1>
		<P class="opacity-50">Validate an address through UPS</P>
	</Div>
	<Div class="relative">
		<Form
			class={twMerge('space-y-8', result !== null ? 'opacity-0' : 'opacity-100')}
			use={[[enhance, enhanceHandler]]}
		>
			<Div class="flex flex-col space-y-4">
				<Fieldset legend="Address">
					<Input bind:value={info.address} name="address" required />
				</Fieldset>
				<Div class="flex flex-col space-y-2">
					<Fieldset legend="ZIP">
						<Input
							bind:value={info.zip}
							class="text-right"
							name="zip"
							onchange={() => {
								const { city, state } = zipcodes.lookup(info.zip) || {
									city: '',
									country: '',
									latitude: 0,
									longitude: 0,
									state: '',
									zip: info.zip
								};
								info.city = city;
								info.state = state;
							}}
							required
							type="number"
						/>
					</Fieldset>
					<Fieldset legend="City">
						<Input bind:value={info.city} name="city" required />
					</Fieldset>
					<Fieldset legend="State">
						<Select bind:value={info.state} name="state" options={stateOptions} required />
					</Fieldset>
				</Div>
			</Div>
			<Button class="relative" {disabled} type="submit">
				{#if disabled}
					<ProgressIndicator
						class="h-6 w-6"
						transition={[scale, { duration: 200, easing: cubicInOut, opacity: 1, start: 0 }]}
					/>
				{:else}
					<Div transition={[scale, { duration: 200, easing: cubicInOut, opacity: 1, start: 0 }]}>
						Validate
					</Div>
				{/if}
			</Button>
		</Form>
		<Div
			class={twMerge(
				'absolute left-0 top-0 flex h-full w-full flex-col space-y-4',
				result === null ? 'pointer-events-none opacity-0' : 'opacity-100'
			)}
		>
			<Div class="flex flex-grow flex-col space-y-4 overflow-auto">
				<Div class="grid grid-cols-[fit-content(0px)_1fr] gap-x-4">
					{#each [...stats] as [label, value]}
						<P class="whitespace-nowrap font-bold">{label}:</P>
						<P>{value}</P>
					{/each}
				</Div>
				{#if result?.indicator === 'ambiguousAddress'}
					<Div class="flex flex-grow flex-col overflow-auto">
						<Table>
							<Tbody>
								{#each result.candidates as { AddressKeyFormat: { AddressLine: address, PoliticalDivision2: city, PoliticalDivision1: state, PostcodePrimaryLow: zip } }}
									<Tr>
										<Td>{address}, {city}, {state} {zip}</Td>
									</Tr>
								{/each}
							</Tbody>
						</Table>
					</Div>
				{/if}
			</Div>
			<Button
				onclick={() => {
					result = null;
				}}
			>
				Validate Another
			</Button>
		</Div>
	</Div>
</Div>
