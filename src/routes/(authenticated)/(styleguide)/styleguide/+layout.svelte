<script>
	import * as Components from '$components';

	// props (internal)
	let group = '1';
</script>

<div class="grid grid-cols-1 gap-[.5rem] md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
	{#each Object.keys(Components).filter((key) => key !== 'Overlay') as key}
		{#if typeof Components[key] === 'function'}
			<Components.Card>
				<div>{key}</div>
				{#if key === 'Radio'}
					<svelte:component this={Components[key]} bind:group value="1">Value 1</svelte:component>
					<svelte:component this={Components[key]} bind:group value="2">Value 2</svelte:component>
				{:else}
					<svelte:component this={Components[key]}>Slot</svelte:component>
				{/if}
			</Components.Card>
		{/if}
	{/each}
</div>
