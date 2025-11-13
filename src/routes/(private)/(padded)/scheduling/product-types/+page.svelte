<script lang="ts">
	import { MongooseTable } from '$lib/components';

	let { data } = $props();
</script>

<MongooseTable {data} modelName={'SchedulingProductType'} />
