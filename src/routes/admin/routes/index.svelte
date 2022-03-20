<script>
	// imports
	import { onMount } from 'svelte';
	import { Card, H6 } from '@components';
	import { socket } from '@stores';

	// handlers

	// utilities

	// props (internal)

	// props (external)

	// props (dynamic)

	// lifecycle
	onMount(() => {
		// socket.find();
	});
</script>

<div class="flex flex-col flex-grow p-[1.5rem] space-y-[1rem]">
	<H6>Routes</H6>
	<Card />
</div>
