<script lang="ts">
	import { MongooseTable } from '$lib/components';

	let { data } = $props();
</script>

<MongooseTable {data} isImportable={true} modelName={'InventoryItemStockingType'} />
