<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Button, Div, Form, H1, Input, SubmitButton } from '$lib/components';
	import { slide } from 'svelte/transition';
	import FormSections from './FormSections.svelte';

	let { data } = $props();
	let _branchId = $state('');
	let formData = $state({
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
	});
	let isLoading = $state(false);
	let isValidationRequired = $state(true);
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
	const submitFunction: SubmitFunction = () => {
		isLoading = true;
		return async ({ update }) => {
			await update();
		};
	};

	const _branchIdOptions = $derived.by(() => [
		{ label: '', value: '' },
		...data.locals.user.branches.map(({ _id, number }) => ({
			label: number.toString(),
			value: _id
		}))
	]);

	$effect(() => {
		if (data.locals.user.branches.length === 1) _branchId = data.locals.user.branches[0]._id;
	});
	$effect(() => {
		if (data._branchId) _branchId = data._branchId;
		if (data.isValidated) isValidationRequired = data.isValidated === 'true';
		if (data.formData) formData = data.formData;
	});
</script>

<Div class="flex flex-col lg:items-start">
	<Div class="flex flex-col space-y-6">
		<Div class="flex items-center justify-between space-x-2">
			<H1 class="whitespace-nowrap">UPS Freight Estimator</H1>
		</Div>
		<Form class="flex w-auto max-w-none flex-col lg:items-end" {submitFunction}>
			<Input
				class="sr-only absolute top-0 left-0 h-0 w-0"
				type="hidden"
				name="_branchId"
				value={_branchId}
			/>
			<FormSections {_branchIdOptions} bind:_branchId bind:formData bind:isValidationRequired />
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
