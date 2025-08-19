<script lang="ts">
	import { MongooseTable } from '$lib/components';
	import type { ColumnOverrides, ColumnSanitized } from '$lib/components/MongooseTable/types.js';

	let { data } = $props();
	const columnOverrides: ColumnOverrides = {
		routes: {
			isSortable: false
		}
	};
</script>

<MongooseTable {columnOverrides} {data} modelName={'Role'} />
