<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import * as components from '$lib/components';
	import { theme } from '$lib/theme';
	import { page } from '$app/state';

	let { children } = $props();

	const breadcrumbs = $derived.by(() =>
		(page.route.id ?? '/(private)/admin/styleguide')
			.replace('/(private)/admin/', '')
			.replace('[Component]', page.params.Component ?? '')
			.split('/')
	);
</script>

<components.Div class="flex max-h-full min-h-full flex-grow overflow-auto">
	<components.Card
		class="flex max-h-full min-h-full min-w-[15rem] flex-col overflow-x-hidden overflow-y-auto rounded-none p-0"
	>
		{#each Object.keys(components) as componentKey}
			<components.A
				class={twMerge(
					$theme.Button.default,
					$theme.Button.ghost,
					$theme.Button.square,
					'justify-start hover:no-underline'
				)}
				href="/admin/styleguide/{componentKey}"
			>
				{componentKey}
			</components.A>
		{/each}
	</components.Card>
	<components.Div class="flex max-h-full min-h-full flex-grow flex-col overflow-auto">
		<components.Div
			class="flex items-center space-x-2 border-b border-slate-200 p-4 dark:border-gray-700"
		>
			{#each breadcrumbs as breadcrumb, breadcrumbIndex}
				{#if breadcrumbIndex !== 0}
					<components.Div>{'/'}</components.Div>
					<components.A href="/admin/styleguide/{breadcrumb}">{breadcrumb}</components.A>
				{:else}
					<components.A href="/admin/styleguide">Styleguide</components.A>
				{/if}
			{/each}
		</components.Div>
		{#if children}
			{@render children()}
		{/if}
	</components.Div>
</components.Div>
