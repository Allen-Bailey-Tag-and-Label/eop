<script lang="ts">
	import { Div, MongooseTable } from '$lib/components';

	let { data } = $props();
</script>

<Div class="flex flex-col p-4">
	<MongooseTable
		{data}
		isCreatable={false}
		isDeletable={false}
		isEditable={false}
		modelName={'UpsQuote'}
		virtualColumns={[
			{ key: 'shipTo.AddressLine', label: 'Street', type: 'string' },
			{ key: 'shipTo.City', label: 'City', type: 'string' },
			{ key: 'shipTo.StateProvinceCode', label: 'State', type: 'string' },
			{ key: 'shipTo.PostalCode', label: 'ZIP', type: 'string' }
		]}
	/>
</Div>
