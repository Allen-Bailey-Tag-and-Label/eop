<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Button, Div, Form, H1, Input, Label, Select, SubmitButton } from '$lib/components';
	import { slide } from 'svelte/transition';
	import FormSections from './FormSections.svelte';

	let { data } = $props();
	let branch = $state(0);
	let isLoading = $state(false);
	let isValidationRequired = $state(true);
	const reset = () => {
		data.formData = {
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
	const submitFunction: SubmitFunction = () => {
		isLoading = true;
		return async ({ update }) => {
			await update();
		};
	};

	const action = $derived.by(() => (isValidationRequired ? '?/validated' : '?/nonValidated'));
	const branchOptions = $derived.by(() => [
		{ label: '', value: 0 },
		...data.locals.user.branches.map(({ number }) => ({
			label: number.toString(),
			value: number
		}))
	]);

	$effect(() => {
		if (data.locals.user.branches.length === 1) branch = data.locals.user.branches[0].number;
	});
</script>

<Div class="flex flex-col lg:items-start">
	<Div class="flex flex-col space-y-6">
		<Div class="flex items-center justify-between space-x-2">
			<H1 class="whitespace-nowrap">UPS Freight Estimator</H1>
			{#if branchOptions.length > 1}
				<Div class="flex flex-col">
					<Label>Branch</Label>
					<Select bind:value={branch} name="branch" options={branchOptions} required={true} />
				</Div>
			{/if}
		</Div>
		<Form {action} class="flex w-auto max-w-none flex-col lg:items-end" {submitFunction}>
			<Input
				class="sr-only absolute top-0 left-0 h-0 w-0"
				type="hidden"
				value={branch.toString()}
			/>
			<FormSections bind:formData={data.formData} bind:isValidationRequired />
			<Div class="flex justify-end space-x-2">
				{#if !isLoading}
					<div transition:slide={{ axis: 'y' }}>
						<Button onclick={reset} variants={['ghost']}>Reset</Button>
					</div>
				{/if}
				<SubmitButton bind:isLoading>Get Quote</SubmitButton>
			</Div>
		</Form>
	</Div>
</Div>
