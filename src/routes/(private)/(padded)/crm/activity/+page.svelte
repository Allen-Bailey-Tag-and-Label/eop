<script lang="ts">
	import { MongooseTable } from '$lib/components';
	import type { ColumnOverrides } from '$lib/components/MongooseTable/types.js';

	let { data } = $props();

	let columnOverrides: ColumnOverrides = {
		_contactId: { label: 'Contact' },
		_customerId: { label: 'Customer' },
		_directionId: { label: 'Direction' },
		_salesOpportunityId: { label: 'Sales Opportunity' },
		_typeId: { label: 'Type' }
	};
</script>

<MongooseTable {columnOverrides} {data} modelName={'CustomerActivity'} />
