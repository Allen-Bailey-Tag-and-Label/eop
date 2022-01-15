<script>
	// imports
	import { onMount } from 'svelte';
	import { browser } from '$app/env';
	import { darkMode } from '$stores';

	// utilities

	// handlers

	// props (internal)
	const classes = {
    false: ['bg-gray-100', 'text-gray-900'],
    true: ['bg-gray-900', 'text-gray-100'],
  }
	let el;

	// props (external)

  // props (dynamic)
	$: if (browser) el = document.querySelector('html');
	$: if ($darkMode !== undefined && el !== undefined) {
    el.classList.remove(...classes[!$darkMode])
		el.classList.add(...classes[$darkMode]);
	}

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

<slot />
