<script lang="ts">
	import { ChevronDown, Menu, X } from '@lucide/svelte';
	import { twMerge } from 'tailwind-merge';
	import { page } from '$app/state';
	import { A, Button, Card, Div, Header } from '$lib/components';
	import { theme as themeStore } from '$lib/theme';
	import { type Navigation, type User } from '$lib/types.js';

	let { children, data } = $props();
	let isNavigationOpen = $state(false);
	let navigation: Navigation[] = $state([]);
	let user: User = $state({ id: -1, isActive: true, username: '' });

	$effect(() => {
		navigation = data.locals.navigation;
		user = data.locals.user;
	});
</script>

<Div class="flex max-h-screen min-h-screen max-w-screen min-w-screen flex-col overflow-auto">
	<Header class="sticky top-0 z-10">
		<Button onclick={() => (isNavigationOpen = !isNavigationOpen)} variants={['ghost', 'icon']}>
			{#if !isNavigationOpen}
				<Menu></Menu>
			{:else}
				<X></X>
			{/if}
		</Button>
	</Header>
	<Div class="relative flex flex-grow flex-col overflow-auto">
		<Div class="pointer-events-none top-0 left-0 z-10 h-full w-full">
			{#if isNavigationOpen}
				<Button
					class="pointer-events-auto absolute top-0 left-0 h-full w-full"
					onclick={() => (isNavigationOpen = false)}
					tabIndex="-1"
					variants={['ghost', 'square']}
				></Button>
				<Card
					class="pointer-events-auto absolute top-0 left-0 z-10 min-h-full w-[calc(100vw_-_3rem)] rounded-none p-0 lg:w-auto lg:min-w-[20rem]"
				>
					<Div class="flex flex-grow flex-col">
						{@render tree(navigation)}
					</Div>
					{@render link('/sign-out', 'Sign Out')}
				</Card>
			{/if}
		</Div>
		<Div class="flex flex-grow flex-col overflow-auto">
			{#if children}
				{@render children()}
			{/if}
		</Div>
	</Div>
</Div>

{#snippet link(href: string, label: string, depth: number = 1)}
	<A
		class={twMerge(
			$themeStore.Button.default,
			'block rounded-none py-0 text-left outline-solid hover:no-underline focus:no-underline',
			page.url.pathname !== href ? 'bg-transparent text-current' : undefined
		)}
		{href}
		onclick={() => {
			isNavigationOpen = false;
		}}
		style="padding-left:{(depth - 1) * 1.5}rem;"
	>
		<Div
			class={twMerge(
				'border-l py-3 pl-6',
				depth > 1 ? 'border-gray-950/30 dark:border-gray-50/30' : 'border-gray-950/0'
			)}
		>
			{label}
		</Div>
	</A>
{/snippet}

{#snippet tree(items: Navigation[], depth: number = 1)}
	<Div class="flex flex-col">
		{#each items as item}
			{#if item.isDirectory}
				<Button
					class={twMerge(
						'flex items-center justify-between border-l',
						depth > 1 ? 'border-gray-950/30 dark:border-gray-50/30' : 'border-gray-950/0'
					)}
					onclick={() => (item.isOpen = !item.isOpen)}
					style="padding-left:{depth * 1.5}rem;"
					variants={['ghost', 'square']}
				>
					<Div>
						{item.label}
					</Div>
					<Div class={twMerge('transition duration-200', item.isOpen ? 'rotate-0' : '-rotate-90')}>
						<ChevronDown />
					</Div>
				</Button>
				{#if item.isOpen && item.children.length > 0}
					{@render tree(item.children, depth + 1)}
				{/if}
			{/if}
			{#if !item.isDirectory && item.href}
				{@render link(item.href, item.label, depth)}
			{/if}
		{/each}
	</Div>
{/snippet}
