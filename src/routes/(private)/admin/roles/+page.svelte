<script lang="ts">
	import { MongooseTable, Div } from '$lib/components';

	let { data } = $props();
</script>

<Div class="flex flex-col p-4">
	<MongooseTable {data} modelName={'Role'} />
</Div>
