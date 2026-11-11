<script lang="ts">
	import { QuoteResults } from '$lib/components';
	import { UPS_SERVICES, type QuoteScenario } from './quote';
	import type { QuoteRateOption } from '$lib/components/QuoteResults/types';
	type Props = {
		scenarios?: QuoteScenario[];
		rates?: { description: string; rate: number }[];
		packageTotalCount?: number;
		packageTotalWeight?: number;
	};
	let { scenarios = [], rates = [], packageTotalCount, packageTotalWeight }: Props = $props();
	const options = $derived<QuoteRateOption[]>(
		scenarios.length
			? scenarios
			: [
					{
						id: 'saved',
						label: 'Shipment',
						status: 'complete',
						message: '',
						services: rates.map((_, index) => `saved_${index}`),
						rates: rates.map((rate, index) => ({ serviceCode: `saved_${index}`, rate: rate.rate })),
						packageTotalCount,
						packageTotalWeight
					}
				]
	);
	const serviceOptions = $derived(
		scenarios.length
			? UPS_SERVICES
			: rates.map((rate, index) => ({ code: `saved_${index}`, title: rate.description }))
	);
</script>

<QuoteResults scenarios={options} {serviceOptions} label="UPS rate comparison" />
