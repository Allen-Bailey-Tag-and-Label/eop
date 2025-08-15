<script lang="ts">
	import { Div, MongooseTable } from '$lib/components';

	let { data } = $props();
</script>

<Div class="flex flex-col p-4">
	<MongooseTable {data} modelName="UserProfile"></MongooseTable>
</Div>
