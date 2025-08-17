<script lang="ts">
	import { Div, MongooseTable } from '$lib/components';

	let { data } = $props();
</script>

<MongooseTable {data} modelName="UserProfile"></MongooseTable>
