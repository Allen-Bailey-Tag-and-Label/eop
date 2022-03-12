<script>
	// imports
	import { onMount } from 'svelte';
	import { theme } from 'sveltewind/stores';
	import { Main, Overlay, Pwa, SafeArea } from '@components';
	import { twMerge } from 'tailwind-merge';
	import '../app.css';

	// props (internal)
	let loaded = false;

	// props (dynamic)
	$: overlayClasses = loaded ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto';

	// lifecycle
	onMount(() => {
		theme.set({
			fieldset: 'space-y-[.25rem]',
			input: 'dark:bg-gray-900 dark:text-gray-50 dark:ring-offset-gray-700'
		});
		loaded = true;
	});
</script>

<Pwa />

<Main>
	<SafeArea>
		<slot />
	</SafeArea>
</Main>

<Overlay
	class={twMerge(
		'transition duration-200 h-screen absolute bg-gray-50 dark:bg-gray-900 flex-grow',
		overlayClasses
	)}
/>
