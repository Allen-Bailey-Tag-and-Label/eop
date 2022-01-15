<script>
	// imports
  import { onMount } from 'svelte';
  import { Icon, Check } from 'svelte-hero-icons';
	import { twMerge } from 'tailwind-merge';
	import { getEvents } from '$actions';

	// utilities

	// handlers

	// props (internal)
	const defaultClasses = 'relative items-center justify-center text-gray-900 ring ring-offset-1 flex cursor-pointer transition duration-200 w-[1.25rem] h-[1.25rem] rounded';
	const events = getEvents();

	// props (external)
	export let checked = false;
	export let disabled = false;
	export let indeterminate = false;
	export let size = 'medium';

	// props (dynamic)
	$: classes = twMerge(defaultClasses, size === 'large' ? 'w-[1.5rem] h-[1.5rem]' : size === 'small' ? 'w-[1rem] h-[1rem]' : 'w-[1.25rem] h-[1.25rem]', (checked || indeterminate) ? 'ring-offset-primary-500 ring-primary-500/0 focus-within:ring-primary-500/[.3] bg-primary-500' : 'ring-offset-white/[.1] ring-white/0 focus-within:ring-white/[.1]', $$props.class);

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

<label class={classes}>
	<input
		bind:checked
		bind:indeterminate
		class="absolute top-0 left-0 w-0 opacity-0"
		{disabled}
		type="checkbox"
		use:events
  />
  {#if checked}
    <Icon src={Check} class={size === 'large' ? 'w-[1.5rem] h-[1.5rem]' : size === 'small' ? 'w-[1rem] h-[1rem]' : 'w-[1.25rem] h-[1.25rem]'} />
  {:else if indeterminate}
    -
  {/if}
</label>
<slot />
