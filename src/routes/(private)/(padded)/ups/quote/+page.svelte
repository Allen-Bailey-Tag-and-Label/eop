<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { createUpsQuote } from './quote.remote';
	import { Button, Div, Form, H1, Input, Spinner } from '$lib/components';
	import { slide } from 'svelte/transition';
	import FormSections from './FormSections.svelte';

	let { data } = $props();
	let _branchId = $state('');
	let error = $state('');
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
	let requestId = crypto.randomUUID();
	let lastSubmission = '';
	const reset = () => {
		requestId = crypto.randomUUID();
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
	const submit = async (event: SubmitEvent) => {
		event.preventDefault();
		if (isLoading) return;
		error = '';
		isLoading = true;
		try {
			const fields = Object.fromEntries(new FormData(event.currentTarget as HTMLFormElement));
			const signature = JSON.stringify(fields);
			if (lastSubmission && lastSubmission !== signature) requestId = crypto.randomUUID();
			lastSubmission = signature;
			const quote = await createUpsQuote({ ...fields, requestId });
			await goto(resolve('/(private)/(padded)/ups/quote/[quote]', { quote: String(quote) }));
		} catch (cause) {
			error =
				cause instanceof Error ? cause.message : 'Could not create the quote. Please try again.';
		} finally {
			isLoading = false;
		}
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
		<Form class="flex w-auto max-w-none flex-col lg:items-end" isEnhanced={false} onsubmit={submit}>
			<Input
				class="sr-only absolute top-0 left-0 h-0 w-0"
				type="hidden"
				name="_branchId"
				value={_branchId}
			/>
			<FormSections {_branchIdOptions} bind:_branchId bind:formData bind:isValidationRequired />
			<Div role="alert" class="min-h-6 w-full text-red-500">
				{error}
			</Div>
			<Div class="flex justify-end space-x-2">
				{#if !isLoading}
					<div transition:slide={{ axis: 'y' }}>
						<Button onclick={reset} variants={['glass']}>Reset</Button>
					</div>
				{/if}
				<Button type="submit" disabled={isLoading} class="flex items-center gap-2">
					{#if isLoading}<Spinner class="h-4 w-4" aria-hidden="true" />{/if}Get Quote
				</Button>
			</Div>
		</Form>
	</Div>
</Div>
