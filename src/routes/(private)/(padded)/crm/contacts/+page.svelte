<script lang="ts">
	import { MongooseTable } from '$lib/components';

	let { data } = $props();
</script>

<MongooseTable
	columnOverrides={{ _customer: { label: 'Customer' } }}
	{data}
	isDeletable={false}
	modelName={'CustomerContact'}
/>
