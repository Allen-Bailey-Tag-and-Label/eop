<script lang="ts">
	import { QuoteResults, P, Td } from '$lib/components';
	import type { Column, TdSnippet } from '$lib/components/Datatable/types';
	import { currency } from '$lib/formats';
	import { shippingResultOptions, shippingResultServices } from './results';
	import type { QuoteView } from './types';
	let { quote }: { quote: QuoteView } = $props();
	const scenarios = $derived(shippingResultOptions(quote));
	const serviceOptions = $derived(shippingResultServices(quote));
	const hasScenarios = $derived(quote.rates.some((rate) => rate.scenarioId));
	const hasLtl = $derived(quote.rates.some((rate) => rate.service === 'LTL'));
	const rows = $derived(
		quote.origin === 'legacy-ups'
			? quote.legacyRates.map((rate) => ({
					description: rate.description,
					price: rate.priceCents / 100
				}))
			: quote.rates.map((rate) => ({
					...rate,
					shipment: rate.scenarioLabel ?? 'Shipment',
					cost: rate.costCents / 100,
					price: rate.priceCents / 100,
					markupText: `${rate.markup.percentBps / 100}% - ${currency(rate.markup.amountCents / 100)} (${rate.markup.label}, revision ${rate.markup.revision})`,
					transit:
						rate.transitDays === undefined
							? ''
							: `${rate.transitDays} business days${rate.estimatedDeliveryDate ? ` - ${rate.estimatedDeliveryDate}` : ''}`
				}))
	);
	const columns = $derived<Column[]>(
		quote.origin === 'legacy-ups'
			? [
					{ key: 'description', label: 'UPS service' },
					{ key: 'price', label: 'Saved customer price', type: 'currency' }
				]
			: [
					...(hasScenarios ? [{ key: 'shipment', label: 'Shipment' }] : []),
					{ key: 'description', label: 'Service', snippet: serviceCell },
					{ key: 'carrier', label: 'Carrier' },
					{ key: 'rateBasis', label: 'Rate basis' },
					{ key: 'cost', label: 'Carrier cost', type: 'currency' },
					...(hasLtl ? [{ key: 'transit', label: 'Transit estimate' }] : []),
					{ key: 'markupText', label: 'Markup' },
					{ key: 'price', label: 'Customer price', type: 'currency' }
				]
	);
</script>

<QuoteResults
	{scenarios}
	{serviceOptions}
	detailColumns={columns}
	detailRows={rows}
	initialView={scenarios.length > 1 ? 'services' : 'details'}
	label="Shipping rate comparison"
/>

{#snippet serviceCell({ object }: TdSnippet)}
	<Td
		>{object.description}{#if object.staging}<P class="text-xs"
				>Staging test rate · Class {object.freightClass}</P
			>{/if}</Td
	>
{/snippet}
