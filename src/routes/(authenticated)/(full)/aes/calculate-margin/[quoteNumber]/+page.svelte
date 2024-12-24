<script lang="ts">
	import { DateTime } from 'luxon';
	import { onMount } from 'svelte';
	import Route from '../+page.svelte';
	import type { Quote } from '../types';
	import type { PageData } from '../$types';

	type Props = {
		data: PageData & { quote: Quote };
	};

	let { data }: Props = $props();
	let quote: Quote = $state({
		id: '',
		customerType: '',
		laborAmount: 0,
		previousLaborAmount: 0,
		previousMarginAmount: 0,
		previousMaterialAmount: 0,
		previousQuoteDate: DateTime.fromFormat('1969-12-31', 'yyyy-MM-dd').toJSDate(),
		previousQuoteNumber: 0,
		previousSellPrice: 0,
		previousTotalCostAmount: 0,
		marginAmount: 0,
		materialAmount: 0,
		productType: '',
		quoteDate: DateTime.fromFormat(DateTime.now().toFormat('yyyy-MM-dd'), 'yyyy-MM-dd').toJSDate(),
		quoteNumber: 0,
		totalCostAmount: 0,
		type: 'have-aes-quote',
		sellPrice: 0
	});

	onMount(() => {
		quote = data.quote;
		quote.previousQuoteDate = DateTime.fromJSDate(data.quote.previousQuoteDate).toJSDate();
		quote.quoteDate = DateTime.fromJSDate(data.quote.quoteDate).toJSDate();
	});
</script>

<Route {quote} state="Update" />
