<script lang="ts">
	import Route from '../quote-finder/+page.svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();
</script>

<Route {data} />
