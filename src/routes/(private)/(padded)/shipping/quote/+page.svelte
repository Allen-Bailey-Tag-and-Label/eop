<script lang="ts">
	import { untrack } from 'svelte';
	import { A, Button, Card, Checkbox, Div, Form, H1, H2, Input, P, Select } from '$lib/components';
	import { theme } from '$lib/theme';
	import { twMerge } from 'tailwind-merge';
	import { blankRequest } from '$lib/shipping/types';
	import AddressFields from '$lib/shipping/editor/AddressFields.svelte';
	import ShipmentItems from '$lib/shipping/editor/ShipmentItems.svelte';
	import type { PageProps } from './$types';
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
	let saving = $state(false);
	const ltl = $derived(draft.services === 'LTL' || draft.services === 'Both');
</script>

<svelte:head><title>Shipping quote - EOP</title></svelte:head>
<Div class="space-y-6">
	<Div class="flex flex-wrap items-center justify-between gap-4"
		><H1>Shipping quote</H1><A
			href="/shipping/quotes"
			class={twMerge($theme.Button.default, 'inline-flex items-center hover:no-underline')}
			>Quote history</A
		></Div
	>
	<P
		>Choose the services to quote, enter the shipment details, and compare customer prices.
		Unmatched cost ranges use 0% markup.</P
	>
	{#if form?.error}<P role="alert" class="text-red-600 dark:text-red-400">{form.error}</P>{/if}
	<Form
		class="w-full max-w-none space-y-6"
		submitFunction={() => {
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
		<Input type="hidden" name="requestId" value={data.requestId} />
		<Card class="space-y-4">
			<H2>Shipment</H2>
			<Div class="grid gap-4 md:grid-cols-3">
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
				<Select
					label="Branch"
					name="branchId"
					bind:value={draft.branchId}
					options={[
						{ value: '', label: 'Select branch' },
						...data.locals.user.branches.map((branch) => ({
							value: branch._id,
							label: `${branch.number} — ${branch.label}`
						}))
					]}
					required
				/>
				<Input label="Ship date" type="date" name="shipDate" bind:value={draft.shipDate} required />
				<Input label="Customer" name="customer" bind:value={draft.customer} maxlength={160} />
				<Input
					label="Reference / order number"
					name="reference"
					bind:value={draft.reference}
					maxlength={100}
				/>
			</Div>
		</Card>
		<Div class="grid gap-6 md:grid-cols-2"
			><AddressFields
				bind:address={draft.shipFrom}
				prefix="shipFrom"
				title="Ship from"
			/><AddressFields bind:address={draft.shipTo} prefix="shipTo" title="Ship to" /></Div
		>
		{#if draft.services === 'UPS' || draft.services === 'Both'}<ShipmentItems
				bind:items={draft.packages}
			/>{/if}
		{#if ltl}
			<ShipmentItems bind:items={draft.freight} freight />
			<Card class="space-y-4">
				<H2>LTL pickup and delivery services</H2>
				<P role="status"
					>Unishippers API access is pending. Your LTL details will be saved, but LTL pricing is not
					available yet. UPS pricing can still be returned when Both is selected.</P
				>
				<Div class="grid gap-4 md:grid-cols-2">
					{#each [{ key: 'pickupLiftgate', label: 'Liftgate pickup' }, { key: 'deliveryLiftgate', label: 'Liftgate delivery' }, { key: 'insidePickup', label: 'Inside pickup' }, { key: 'insideDelivery', label: 'Inside delivery' }, { key: 'limitedAccessPickup', label: 'Limited access pickup' }, { key: 'limitedAccessDelivery', label: 'Limited access delivery' }] as option (option.key)}
						<Checkbox
							label={option.label}
							name={option.key}
							bind:checked={draft.accessorials[option.key as keyof typeof draft.accessorials]}
						/>
					{/each}
				</Div>
			</Card>
		{/if}
		<Div class="flex justify-end"
			><Button type="submit" disabled={saving}>{saving ? 'Getting quotes…' : 'Get quotes'}</Button
			></Div
		>
	</Form>
</Div>
