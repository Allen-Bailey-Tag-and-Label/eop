<script lang="ts">
	import * as components from '$lib/components';
	import { componentData, componentKeys } from './index';
</script>

<components.Div class="flex flex-col items-start space-y-16 overflow-auto p-4">
	{#each componentKeys as componentKey}
		{@const Component = components[componentKey]}
		<components.Div class="flex flex-col">
			<components.H1>{componentKey}</components.H1>
			{#if componentData[componentKey]}
				{#if componentData[componentKey]?.children}
					<Component {...componentData[componentKey]?.props}>
						{componentData[componentKey].children}
					</Component>
				{:else}
					<Component {...componentData[componentKey]?.props} />
				{/if}
			{/if}
		</components.Div>
	{/each}
</components.Div>
