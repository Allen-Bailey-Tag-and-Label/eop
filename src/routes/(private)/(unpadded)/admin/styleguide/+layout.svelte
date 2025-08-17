<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import * as components from '$lib/components';
	import { theme } from '$lib/theme';
	import { page } from '$app/state';

	let { children } = $props();

	const breadcrumbs = $derived.by(() => {
		const [first, ...rest] = page.url
			.toString()
			.replace(/.+admin\/styleguide/g, '')
			.split('/')
			.map((label) => ({ href: `/admin/styleguide/${label}`, label }));

		first.label = 'Styleguide';
		return [first, ...rest];
	});
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
			{#each breadcrumbs as { href, label }, breadcrumbIndex}
				{#if breadcrumbIndex !== 0}
					<components.Div>{'/'}</components.Div>
				{/if}
				<components.A {href}>{label}</components.A>
			{/each}
		</components.Div>
		{#if children}
			{@render children()}
		{/if}
	</components.Div>
</components.Div>
