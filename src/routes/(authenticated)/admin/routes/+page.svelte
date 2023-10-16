<script>
	import { DataTable } from '$components';

	// props (external)
	export let data;

	// props (internal)
	let columns = [];

	$: if (columns.length === 0 && data?.streamed?.routes.length > 0)
		columns = Object.keys(data.streamed.routes[0]).map((key) => {
			return {
				editable: key === 'id' ? false : true,
				label: key,
				key,
				type: typeof data.streamed.routes[0][key]
			};
		});
</script>

{#await data.streamed.routes}
	Loading...
{:then value}
	<DataTable bind:columns rows={value} />
{/await}
