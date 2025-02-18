<script lang="ts">
	import { states } from 'states-us';
	import zipcodes from 'zipcodes';
	import { deserialize } from '$app/forms';
	import {
		Button,
		Card,
		Checkbox,
		Div,
		Fieldset,
		Form,
		H5,
		Icon,
		Input,
		Modal,
		P,
		ProgressIndicator,
		Select
	} from '$lib/components';
	import { ExclamationTriangle } from 'sveltewind/icons';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { ActionResult } from '@sveltejs/kit';
	import type { Candidate, Result } from '../../../(2-section)/(form)/ups/validate/types';

	let { data } = $props();
	const getRates = async () => {
		submitStatus = 'getting rates';

		const body = new FormData();

		body.append('classification', info.classification);
		body.append('fromAddress', info.fromAddress);
		body.append('fromCity', info.fromCity);
		body.append('fromState', info.fromState);
		body.append('fromZip', info.fromZip);
		body.append('numberOfPackages', info.numberOfPackages);
		body.append('toAddress', info.toAddress);
		body.append('toCity', info.toCity);
		body.append('toState', info.toState);
		body.append('totalWeight', info.totalWeight);
		body.append('toZip', info.toZip);

		const response = await fetch('/ups/quote', {
			method: 'POST',
			body
		});

		const result: ActionResult = deserialize(await response.text());

		if (result.type === 'success' && result.data) {
			goto(`/ups/quote/${result.data.number}`);
		}
	};
	let info = $state({
		classification: 'Unknown',
		fromAddress: '3177 Lehigh Street',
		fromCity: 'Caledonia',
		fromState: 'NY',
		fromZip: '14423',
		numberOfPackages: '1',
		toAddress: '',
		toCity: '',
		toState: '',
		totalWeight: '30',
		toZip: ''
	});
	const modal: {
		candidate: {
			close?: () => void;
			data: {
				candidates: Candidate[];
				candidateIndex: -1;
				candidateOptions: { label: string; value: number }[];
				key: 'from' | 'to';
			};
			isVisible: boolean;
			open?: () => void;
			submitHandler?: (event: SubmitEvent) => void;
			toggle?: () => void;
		};
		error: {
			close?: () => void;
			isVisible: boolean;
			message: string;
			open?: () => void;
			toggle?: () => void;
		};
	} = $state({
		candidate: {
			data: {
				candidates: [],
				candidateIndex: -1,
				candidateOptions: [],
				key: 'from'
			},
			isVisible: false,
			submitHandler: async (event: SubmitEvent) => {
				event.preventDefault();
				const { candidates, candidateIndex, key } = modal.candidate.data;
				if (candidateIndex === -1) return;
				info[`${key}Address`] = candidates[candidateIndex].AddressKeyFormat.AddressLine;
				info[`${key}City`] = candidates[candidateIndex].AddressKeyFormat.PoliticalDivision2;
				info[`${key}State`] = candidates[candidateIndex].AddressKeyFormat.PoliticalDivision1;
				info[`${key}Zip`] = candidates[candidateIndex].AddressKeyFormat.PostcodePrimaryLow;
				if (modal.candidate.close) modal.candidate.close();
				await submitHandler(event);
			}
		},
		error: {
			isVisible: false,
			message: ''
		}
	});
	let shouldValidate = $state(true);
	const stateOptions = states.map((state) => ({
		label: state.abbreviation,
		value: state.abbreviation
	}));
	const submitHandler = async (event: SubmitEvent) => {
		event.preventDefault();
		try {
			if (shouldValidate) {
				await validateAddresses();
			}
			await getRates();
		} catch (error) {
			console.log(error);
		}
	};
	let submitStatus: 'getting rates' | 'validating' | 'waiting' = $state('waiting');
	const validateAddress = async ({ key }: { key: 'from' | 'to' }) => {
		const body = new FormData();

		body.append('address', info[`${key}Address`]);
		body.append('city', info[`${key}City`]);
		body.append('state', info[`${key}State`]);
		body.append('zip', info[`${key}Zip`]);

		const response = await fetch('/ups/validate', {
			method: 'POST',
			body
		});

		// @ts-ignore
		const {
			data: { candidates, indicator }
		}: { data: Result } = deserialize(await response.text());

		if (indicator === 'validAddress') {
			if (key === 'to') info.classification = candidates[0].AddressClassification.Description;
			info[`${key}Address`] = candidates[0].AddressKeyFormat.AddressLine;
			info[`${key}City`] = candidates[0].AddressKeyFormat.PoliticalDivision2;
			info[`${key}State`] = candidates[0].AddressKeyFormat.PoliticalDivision1;
			info[`${key}Zip`] = candidates[0].AddressKeyFormat.PostcodePrimaryLow;
		}
		if (indicator === 'ambiguousAddress') {
			modal.candidate.data = {
				candidates,
				candidateIndex: -1,
				candidateOptions: [
					{ label: '--Choose an address', value: -1 },
					...candidates.map(({ AddressKeyFormat: { AddressLine, Region } }, index) => ({
						label: `${AddressLine} ${Region}`,
						value: index
					}))
				],
				key
			};
			if (modal.candidate.open) modal.candidate.open();
			submitStatus = 'waiting';
			throw new Error();
		}
		if (indicator === 'noCandidates') {
			modal.error.message = 'No address candidates could be found.';
			if (modal.error.open) modal.error.open();
			submitStatus = 'waiting';
			throw new Error();
		}
	};
	const validateAddresses = async () => {
		submitStatus = 'validating';
		await Promise.all([validateAddress({ key: 'from' }), validateAddress({ key: 'to' })]);
	};

	// $derives
	const formIsDisabled = $derived(submitStatus !== 'waiting');

	onMount(() => {
		info = data.info;
	});
</script>

<Card class="py-0 lg:self-start">
	<Form
		class="space-y-0 divide-y divide-slate-950/20 dark:divide-slate-50/10"
		onsubmit={submitHandler}
		use={[]}
	>
		<Div
			class="flex flex-col space-y-0 divide-y divide-slate-950/20 lg:grid lg:grid-cols-3 lg:gap-8 lg:divide-y-0 dark:divide-slate-50/10"
		>
			{@render address({ key: 'from', label: 'Ship From' })}
			{@render address({ key: 'to', label: 'Ship To' })}
			<Div class="flex flex-col divide-y divide-slate-950/20 dark:divide-slate-50/10">
				<Div class="flex flex-col space-y-2 py-6">
					<H5>Package Info</H5>
					<Fieldset legend="Number of Packages">
						<Input
							bind:value={info.numberOfPackages}
							class="text-right"
							name="numberOfPackages"
							type="number"
						/>
					</Fieldset>
					<Fieldset legend="Total Weight">
						<Input
							bind:value={info.totalWeight}
							class="text-right"
							name="totalWeight"
							type="number"
						/>
					</Fieldset>
				</Div>
				<Div class="flex flex-col space-y-2 py-6">
					<H5>Options</H5>
					<Checkbox bind:checked={shouldValidate} name="shouldValidate">
						Validate Addresses?
					</Checkbox>
				</Div>
			</Div>
		</Div>
		<Div class="flex w-full flex-col py-6">
			<Button
				class="w-full space-x-4 lg:w-auto lg:self-end"
				disabled={formIsDisabled}
				type="submit"
			>
				{#if submitStatus === 'waiting'}
					Get Rates
				{:else}
					<ProgressIndicator class="h-4 w-4" />
					{#if submitStatus === 'validating'}
						<Div>Validating...</Div>
					{:else if submitStatus === 'getting rates'}
						<Div>Getting Rates...</Div>
					{/if}
				{/if}
			</Button>
		</Div>
	</Form>
</Card>

<Modal
	bind:close={modal.candidate.close}
	bind:isVisible={modal.candidate.isVisible}
	bind:open={modal.candidate.open}
	bind:toggle={modal.candidate.toggle}
>
	<Form onsubmit={modal.candidate.submitHandler} use={[]}>
		<H5>Ship {modal.candidate.data.key === 'from' ? 'From' : 'To'} Candidates</H5>
		<Select
			bind:value={modal.candidate.data.candidateIndex}
			options={modal.candidate.data.candidateOptions}
			required
		/>
		<Div class="grid grid-cols-2 gap-2 lg:flex lg:justify-end">
			<Button onclick={modal.candidate.close} variants={['default', 'contrast']}>Cancel</Button>
			<Button type="submit">Update</Button>
		</Div>
	</Form>
</Modal>

<Modal
	bind:close={modal.error.close}
	bind:isVisible={modal.error.isVisible}
	bind:open={modal.error.open}
	bind:toggle={modal.error.toggle}
>
	<Icon class="mx-auto h-[5rem] w-[5rem] text-red-500" src={ExclamationTriangle} />
	<P class="py-4 pb-6">{modal.error.message}</P>
	<Div class="grid grid-cols-1 gap-2 lg:flex lg:justify-end">
		<Button onclick={modal.error.close}>Try Again</Button>
	</Div>
</Modal>

{#snippet address({ key, label }: { key: 'from' | 'to'; label: string })}
	<Div class="flex flex-col space-y-2 py-6">
		<H5>{label}</H5>
		<Fieldset legend="Address">
			<Input bind:value={info[`${key}Address`]} name="{key}Address" required />
		</Fieldset>
		<Div class="flex flex-col space-y-2">
			<Fieldset legend="ZIP">
				<Input
					bind:value={info[`${key}Zip`]}
					class="text-right"
					name="{key}ZIP"
					onchange={() => {
						const { city, state } = zipcodes.lookup(info[`${key}Zip`]) || {
							city: '',
							country: '',
							latitude: 0,
							longitude: 0,
							state: '',
							zip: info[`${key}Zip`]
						};
						info[`${key}City`] = city;
						info[`${key}State`] = state;
					}}
					required
					type="number"
				/>
			</Fieldset>
			<Fieldset legend="City">
				<Input bind:value={info[`${key}City`]} name="{key}City" required />
			</Fieldset>
			<Fieldset legend="State">
				<Select
					bind:value={info[`${key}State`]}
					name="{key}State"
					options={stateOptions}
					required
				/>
			</Fieldset>
		</Div>
	</Div>
{/snippet}
