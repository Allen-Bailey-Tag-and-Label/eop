<script>
	// imports
	import { onMount } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { Icon, ArrowSmDown, ArrowSmUp, Selector } from 'svelte-hero-icons';
	// import { getEvents } from '$actions';

	// utilities

	// handlers
	const thClickHandler = (key) => {
		if (sort.key === key) sort.direction *= -1;
		if (sort.key !== key) sort.direction = 1;
		sort.key = key;
	};

	// props (internal)
	const defaultClasses =
		'p-[.5rem] pr-[2rem] whitespace-nowrap uppercase text-[.75rem] leading-[1rem] resize-x overflow-x-auto relative bg-white/[.05]';
	// const events = getEvents();

	// props (external)
	export let key = '';
	export let sort = {
		direction: 1,
		key: ''
	};

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

<th class={classes}>
	<slot />
	{#if sort !== false}
		<div
			class="absolute right-0 top-1/2 cursor-pointer transform translate-y-[-50%] p-[.5rem] {key ===
			sort.key
				? 'text-primary-500'
				: ''}"
			on:click={() => thClickHandler(key)}
		>
			{#if key === sort.key && sort.direction === -1}
				<Icon src={ArrowSmUp} class="w-[1rem] h-[1rem]" />
			{:else if key === sort.key && sort.direction === 1}
				<Icon src={ArrowSmDown} class="w-[1rem] h-[1rem]" />
			{:else}
				<Icon src={Selector} class="w-[1rem] h-[1rem]" />
			{/if}
		</div>
	{/if}
</th>
