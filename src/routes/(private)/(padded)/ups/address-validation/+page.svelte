<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import { states } from 'states-us';
	import zipcodes from 'zipcodes';
	import {
		Button,
		Card,
		Div,
		Form,
		Input,
		Select,
		SubmitButton,
		Table,
		Tbody,
		Td,
		Th,
		Thead,
		Tr
	} from '$lib/components';
	import type { Candidate } from './types';
	import { slide } from 'svelte/transition';

	let address = $state({
		address: '',
		city: '',
		state: '',
		zip: ''
	});
	let candidates: Candidate[] = $state([]);
	let errorMessage = $state('');
	let isLoading = $state(false);
	const reset = () => {
		address = {
			address: '',
			city: '',
			state: '',
			zip: ''
		};
	};
	const submitFunction: SubmitFunction = () => {
		candidates = [];
		errorMessage = '';
		isLoading = true;
		return async ({ result, update }) => {
			isLoading = false;
			if (result.type === 'success') {
				const { data } = result;
				console.log(data);
				if (data) candidates = data;
				if (!data) errorMessage = 'Could not find any possible candidates';
			}
		};
	};

	const stateOptions = $derived.by(() => [
		{ label: '', value: '' },
		...states.map(({ abbreviation }) => ({ label: abbreviation, value: abbreviation }))
	]);
</script>

{#if candidates.length === 0}
	<Form {submitFunction}>
		{#snippet inputs()}
			<Input bind:value={address.address} label="Address" name="address" required={true} />
			<Input
				bind:value={address.zip}
				label="ZIP"
				name="zip"
				onchange={() => {
					const result = zipcodes.lookup(address.zip);
					if (result === undefined) return;
					address.city = result.city;
					address.state = result.state;
				}}
				required={true}
				type="number"
			/>
			<Input bind:value={address.city} label="City" name="city" required={true} />
			<Select
				bind:value={address.state}
				label="State"
				name="state"
				options={stateOptions}
				required={true}
			/>
		{/snippet}
		{#snippet error()}
			{#if errorMessage !== ''}
				{errorMessage}
			{/if}
		{/snippet}
		{#snippet buttons()}
			{#if !isLoading}
				<div transition:slide={{ axis: 'y' }}>
					<Button onclick={reset} variants={['ghost']}>Reset</Button>
				</div>
			{/if}
			<SubmitButton bind:isLoading>Validate</SubmitButton>
		{/snippet}
	</Form>
{:else}
	<Div class="flex flex-col items-start">
		<Div class="flex flex-col items-end space-y-6">
			<Card class="rounded-none p-0">
				<Table>
					<Thead>
						<Tr>
							<Th>Classification</Th>
							<Th>Address</Th>
							<Th>City</Th>
							<Th>State</Th>
							<Th>ZIP</Th>
							<Th>+4</Th>
						</Tr>
					</Thead>
					<Tbody>
						{#each candidates as { AddressClassification, AddressKeyFormat }}
							<Tr>
								<Td>{AddressClassification.Description}</Td>
								<Td>{AddressKeyFormat.AddressLine[0]}</Td>
								<Td>{AddressKeyFormat.PoliticalDivision2}</Td>
								<Td>{AddressKeyFormat.PoliticalDivision1}</Td>
								<Td>{AddressKeyFormat.PostcodePrimaryLow}</Td>
								<Td>{AddressKeyFormat.PostcodeExtendedLow}</Td>
							</Tr>
						{/each}
					</Tbody>
				</Table>
			</Card>
			<Div class="flex flex-grow justify-end space-x-2">
				<Button
					onclick={() => {
						candidates = [];
					}}
				>
					Validate Another Address
				</Button>
			</Div>
		</Div></Div
	>
{/if}
