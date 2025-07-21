<script lang="ts">
	import * as components from '$lib/components';

	type ComponentKey = keyof typeof components;
</script>

<components.Div class="flex flex-col divide-y divide-gray-950 p-6 dark:divide-gray-50">
	{#each <ComponentKey[]>Object.keys(components) as componentKey, componentIndex}
		{#if componentIndex < 2}
			{@const Component = components[componentKey]}
			<components.Div class="flex flex-col py-6">
				<components.H1>{componentKey}</components.H1>
				<Component>Test</Component>
			</components.Div>
		{/if}
	{/each}
</components.Div>
