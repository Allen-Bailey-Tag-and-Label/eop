<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import * as components from '$lib/components';
	import { theme } from '$lib/theme';
	import { page } from '$app/state';
	import { portal } from '$lib/attachments';
	import { Menu } from '@lucide/svelte';

	let { children } = $props();

	const breadcrumbs = $derived.by(() => {
		const [first, ...rest] = page.url
			.toString()
			.replace(/.+admin\/components/g, '')
			.split('/')
			.map((label) => ({ href: `/admin/components/${label}`, label }));

		first.label = 'Components';
		return [first, ...rest];
	});
	const modal = $state({
		close: () => (modal.isOpen = false),
		isOpen: false,
		open: () => (modal.isOpen = true)
	});
</script>

<components.Div class="flex max-h-full min-h-full flex-grow flex-col overflow-auto lg:flex-row">
	<components.Card
		class="hidden max-h-full min-h-full min-w-[15rem] flex-col overflow-x-hidden overflow-y-auto rounded-none p-0 lg:flex"
	>
		{#each Object.keys(components) as componentKey}
			<components.A
				class={twMerge(
					$theme.Button.default,
					$theme.Button.ghost,
					$theme.Button.square,
					'justify-start hover:no-underline'
				)}
				href="/admin/components/{componentKey}"
			>
				{componentKey}
			</components.A>
		{/each}
	</components.Card>
	{#if modal.isOpen}
		<components.Button
			{@attach portal()}
			class="fixed top-0 left-0 min-h-full min-w-full backdrop-blur-md"
			onclick={modal.close}
			variants={['ghost']}
		/>
		<components.Card
			{@attach portal()}
			class="fixed max-h-full min-h-full min-w-[calc(100%_-_2rem)] flex-col overflow-x-hidden overflow-y-auto rounded-none p-0 lg:hidden"
		>
			{#each Object.keys(components) as componentKey}
				<components.A
					class={twMerge(
						$theme.Button.default,
						$theme.Button.ghost,
						$theme.Button.square,
						'justify-start hover:no-underline'
					)}
					href="/admin/components/{componentKey}"
				>
					{componentKey}
				</components.A>
			{/each}
		</components.Card>
	{/if}
	<components.Div class="flex max-h-full min-h-full flex-grow flex-col overflow-auto">
		<components.Div
			class="flex items-center space-x-2 border-b border-slate-200 p-4 dark:border-gray-700"
		>
			<components.Button class="lg:hidden" onclick={modal.open} variants={['icon']}>
				<Menu />
			</components.Button>
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
