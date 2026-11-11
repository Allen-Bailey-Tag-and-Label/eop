<script lang="ts">
	import { untrack } from 'svelte';
	import {
		A,
		Button,
		Checkbox,
		Div,
		Form,
		H1,
		H3,
		Input,
		P,
		Select,
		Spinner
	} from '$lib/components';
	import { theme } from '$lib/theme';
	import { twMerge } from 'tailwind-merge';
	import { blankRequest } from '$lib/shipping/types';
	import FormSections from '$lib/ups/FormSections.svelte';
	import RateStrategies from '$lib/ups/RateStrategies.svelte';
	import { blankRateScenario, scenarioInput, type RateScenarioInput } from '$lib/ups/quote';
	import ShipmentItems from '$lib/shipping/editor/ShipmentItems.svelte';
	import type { PageProps } from './$types';
	import type { Branch } from '$lib/types';
	let { data, form }: PageProps = $props();
	let draft = $state(
		untrack(() => {
			const value = data.initialRequest
				? structuredClone(data.initialRequest)
				: blankRequest(data.shipDate);
			value.shipDate = data.shipDate;
			value.branchId ||=
				data.locals.user.defaultBranch?._id ?? data.locals.user.branches[0]?._id ?? '';
			if (!value.packages.length) value.packages = blankRequest(data.shipDate).packages;
			if (!value.freight.length) value.freight = blankRequest(data.shipDate).freight;
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
	let rateRows = $state<RateScenarioInput[]>(
		untrack(() => {
			if (data.initialRequest?.upsScenarios?.length)
				return data.initialRequest.upsScenarios.map(scenarioInput);
			if (data.initialRequest?.packages.length)
				return [
					{
						...blankRateScenario(),
						weightMode: 'groups',
						groups: data.initialRequest.packages.map((group) => ({
							id: crypto.randomUUID(),
							quantity: String(group.quantity),
							weight: String(group.weight)
						}))
					}
				];
			return [blankRateScenario()];
		})
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
		draft = { ...blankRequest(data.shipDate), branchId: draft.branchId };
		formData = addressForm();
		rateRows = [blankRateScenario()];
		isValidationRequired = true;
		requestId = crypto.randomUUID();
		form = null;
	}
</script>

<svelte:head><title>Shipping quote - EOP</title></svelte:head>
<Div class="w-full min-w-0 space-y-6">
	<Div class="flex flex-wrap items-center justify-between gap-4">
		<H1>Shipping quote</H1>
		<A
			href="/shipping/quote-finder"
			class={twMerge($theme.Button.default, 'inline-flex items-center hover:no-underline')}
			>Quote history</A
		>
	</Div>
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
			shipmentHeader={shipmentDetails}
			packageFields={packageDetails}
			extraFields={extraInfo}
		>
			{#snippet actions()}{@render quoteActions()}{/snippet}
		</FormSections>
	</Form>
</Div>

{#snippet shipmentDetails()}
	<Select
		label="Services to quote"
		name="services"
		bind:value={draft.services}
		options={[
			{ value: 'UPS', label: 'UPS' },
			{ value: 'LTL', label: 'LTL' },
			{ value: 'Both', label: 'Both' }
		]}
		required
	/>
{/snippet}

{#snippet packageDetails()}
	{#if draft.services === 'UPS' || draft.services === 'Both'}
		<RateStrategies bind:rows={rateRows} />
	{/if}
	{#if ltl}
		<ShipmentItems bind:items={draft.freight} freight />
		<P class="col-span-full" role="status"
			>Unishippers API access is pending. Your LTL details will be saved, but LTL pricing is not
			available yet. UPS pricing can still be returned when Both is selected.</P
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
