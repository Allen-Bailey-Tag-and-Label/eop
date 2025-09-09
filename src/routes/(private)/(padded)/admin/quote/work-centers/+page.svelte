<script>
	import { MongooseTable } from '$lib/components';

	let { data } = $props();
	let columnOverrides = $state({
		_branchId: { label: 'Branch' },
		machineSetupRate: { type: 'currency' },
		machineRunRate: { type: 'currency' }
	});
</script>

<MongooseTable bind:columnOverrides {data} modelName="QuoteWorkCenter"></MongooseTable>
