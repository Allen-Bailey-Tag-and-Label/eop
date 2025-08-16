<script lang="ts">
	import { untrack } from 'svelte';
	import Route from '../+page.svelte';
	import type { Props } from '../types';
	let { data } = $props();

	let quote: Required<Props> = $state({
		current: {
			date: new Date().toISOString().split('T')[0],
			labor: '',
			margin: '',
			material: '',
			number: '',
			sell: '',
			totalCost: ''
		},
		customerType: '',
		isNumberAlreadySet: true,
		previous: {
			date: '',
			labor: '',
			margin: '',
			material: '',
			number: '',
			sell: '',
			totalCost: ''
		},
		productType: ''
	});
	$effect(() => {
		quote = data.quote;
		untrack(() => {
			quote.current.date = new Date(quote.current.date).toISOString().split('T')[0];
			quote.isNumberAlreadySet = true;
			quote.previous.date = new Date(quote.previous.date).toISOString().split('T')[0];
		});
	});
</script>

<Route {...quote} />
