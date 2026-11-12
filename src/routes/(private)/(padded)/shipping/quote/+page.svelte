<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { preloadCode } from '$app/navigation';
	import { Button, Checkbox, Div, Form, H1, H3, Input, P, Tabs, Spinner } from '$lib/components';
	import { blankRequest, DEFAULT_NMFC_CODE } from '$lib/shipping/types';
	import FormSections from '$lib/ups/FormSections.svelte';
	import PackingEditor from '$lib/shipping/editor/PackingEditor.svelte';
	import {
		blankShippingScenario,
		changePackingBasis,
		packingInputsFromRequest,
		type ShippingScenarioInput
	} from '$lib/shipping/packing';
	import type { PageProps } from './$types';
	import type { Branch } from '$lib/types';
	let { data, form }: PageProps = $props();
	onMount(() => {
		// Warm the results route's code without requesting a quote or waiting at submission.
		void preloadCode('/shipping/quotes/*').catch(() => {});
	});
	const emptyDraft = () => ({ ...blankRequest(data.shipDate), services: 'Both' as const });
	let draft = $state(
		untrack(() => {
			const value = data.initialRequest ? structuredClone(data.initialRequest) : emptyDraft();
			value.shipDate = data.shipDate;
			value.branchId ||=
				data.locals.user.defaultBranch?._id ?? data.locals.user.branches[0]?._id ?? '';
			if (!value.packages.length) value.packages = blankRequest(data.shipDate).packages;
			if (!value.freight.length) value.freight = blankRequest(data.shipDate).freight;
			value.freight = value.freight.map((item) => ({
				...item,
				nmfc: item.nmfc || DEFAULT_NMFC_CODE
			}));
			return value;
		})
	);
	let requestId = $state(untrack(() => data.requestId));
	let saving = $state(false);
	let isValidationRequired = $state(untrack(() => data.initialRequest?.validateAddresses ?? true));
	const addressForm = () => ({
		shipFrom: {
			address: draft.shipFrom.address,
			city: draft.shipFrom.city,
			state: draft.shipFrom.state,
			zip: draft.shipFrom.zip
		},
		shipTo: {
			address: draft.shipTo.address,
			city: draft.shipTo.city,
			state: draft.shipTo.state,
			zip: draft.shipTo.zip
		},
		packageInfo: { totalPackages: '', totalWeight: '' }
	});
	let formData = $state(untrack(addressForm));
	let rateRows = $state<ShippingScenarioInput[]>(
		untrack(() => packingInputsFromRequest(data.initialRequest))
	);
	const branchOptions = $derived([
		{ label: '', value: '' },
		...data.locals.user.branches.map((branch: Branch) => ({
			label: String(branch.number),
			value: branch._id
		}))
	]);
	const ltl = $derived(draft.services === 'LTL' || draft.services === 'Both');
	function reset() {
		draft = { ...emptyDraft(), branchId: draft.branchId };
		formData = addressForm();
		rateRows = [blankShippingScenario()];
		isValidationRequired = true;
		requestId = crypto.randomUUID();
		form = null;
	}
</script>

<svelte:head><title>Shipping quote - EOP</title></svelte:head>
<Div class="w-full min-w-0 space-y-6">
	<H1>Shipping quote</H1>
	<Form
		class="w-full max-w-none"
		submitFunction={({ cancel }) => {
			if (saving) {
				cancel();
				return;
			}
			saving = true;
			return async ({ update }) => {
				try {
					await update({ reset: false });
				} finally {
					saving = false;
				}
			};
		}}
	>
		<Input type="hidden" name="requestId" value={requestId} />
		<Input type="hidden" name="_branchId" value={draft.branchId} />
		<FormSections
			bind:_branchId={draft.branchId}
			_branchIdOptions={branchOptions}
			bind:formData
			bind:isValidationRequired
			bind:rateRows
			responsive
			services={serviceSelection}
			packageFields={packageDetails}
			extraFields={extraInfo}
		>
			{#snippet actions()}{@render quoteActions()}{/snippet}
		</FormSections>
	</Form>
</Div>

{#snippet serviceSelection()}
	<Input type="hidden" name="services" value={draft.services} />
	<Tabs
		aria-label="Services to quote"
		value={draft.services}
		onValueChange={(value) => {
			draft.services = value;
			if (value !== 'Both') for (const row of rateRows) changePackingBasis(row, value);
		}}
		tabs={[
			{ value: 'Both', title: 'Both' },
			{ value: 'LTL', title: 'LTL' },
			{ value: 'UPS', title: 'UPS' }
		]}
	/>
{/snippet}

{#snippet packageDetails()}
	<PackingEditor bind:rows={rateRows} services={draft.services} />
	{#if ltl}
		<P class="col-span-full" role="status"
			>{!data.unishippers?.configured
				? 'Unishippers LTL is not configured on this server. Freight details can be saved, but no LTL prices will be returned.'
				: data.unishippers.staging
					? 'LTL uses Unishippers staging prices. Freight class is calculated from each handling unit’s density. These are not live-account rates.'
					: 'LTL carrier prices will be retrieved from Unishippers.'}</P
		>
	{/if}
{/snippet}

{#snippet extraInfo()}
	{#if ltl}
		<Div class="col-span-full space-y-4">
			<H3 class="text-base">LTL pickup and delivery services</H3>
			<Div class="grid gap-4 sm:grid-cols-2">
				{#each [{ key: 'pickupLiftgate', label: 'Liftgate pickup' }, { key: 'deliveryLiftgate', label: 'Liftgate delivery' }, { key: 'insidePickup', label: 'Inside pickup' }, { key: 'insideDelivery', label: 'Inside delivery' }, { key: 'limitedAccessPickup', label: 'Limited access pickup' }, { key: 'limitedAccessDelivery', label: 'Limited access delivery' }] as option (option.key)}
					<Checkbox
						label={option.label}
						name={option.key}
						bind:checked={draft.accessorials[option.key as keyof typeof draft.accessorials]}
					/>
				{/each}
			</Div>
		</Div>
	{/if}
{/snippet}

{#snippet quoteActions()}
	<Div role="alert" class="min-h-6 w-full text-red-500">{form?.error ?? ''}</Div>
	<Div class="flex justify-end gap-2">
		{#if !saving}<Button onclick={reset} variants={['glass']}>Reset</Button>{/if}
		<Button type="submit" disabled={saving} class="flex items-center gap-2">
			{#if saving}<Spinner class="h-4 w-4" aria-hidden="true" />{/if}Get quotes
		</Button>
	</Div>
{/snippet}
