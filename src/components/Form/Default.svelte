<script>
	// imports
	import { onMount } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { getEvents } from '$actions';

	// utilities

	// handlers

	// props (internal)
	const defaultClasses = 'flex flex-col space-y-[2rem] w-full max-w-[375px]';
	const events = getEvents();

	// props (external)

	// props (dynamic)
	$: classes = twMerge(defaultClasses, '', $$props.class);

	// lifecycle
	const lifecycle = {
		destroy: () => {},
		mount: async () => {}
	};
	onMount(async () => {
		await lifecycle.mount();
		return () => {
			lifecycle.destroy();
		};
	});
</script>

<form 
	class={classes} 
	use:events
>
	<slot />
</form>
