<script>
	// imports
	import { onDestroy, onMount } from 'svelte';
  import { Route, SocketTable } from '$components';
	// import { socket, token } from '$stores';
	import { defaultColumns } from './_imports';

	// utilities

	// handlers

	// props (internal)
	let columns = defaultColumns;
	const tableOptions = {
		sort: {
			direction: 1,
			key: 'group'
		},
		title: 'Routes'
	};
	let rows = [];

	// props (external)

	// props (dynamic)

	// lifecycle
	const lifecycle = {
		destroy: async () => {},
		mount: async () => {}
	};
	onDestroy(async() => await lifecycle.destroy());
	onMount(async () => await lifecycle.mount());
</script>

<Route class="flex flex-col items-stretch justify-start overflow-hidden">
	<SocketTable 
		collection='routes'
		bind:columns 
		bind:rows 
		{...tableOptions} 
	/>
</Route>

<slot />
