<script lang="ts">
	import { ChevronDown, Menu, X } from '@lucide/svelte';
	import { twMerge } from 'tailwind-merge';
	import { page } from '$app/state';
	import { A, Button, Div } from '$lib/components';
	import { type Navigation, type User } from '$lib/types.js';

	let { children, data } = $props();
	let isNavigationOpen = $state(true);
	let navigation: Navigation[] = $state([]);
	let user: User = $state({ id: -1, isActive: true, username: '' });

	$effect(() => {
		navigation = data.locals.navigation;
		user = data.locals.user;
	});
</script>

<Div class="relative flex max-h-screen min-h-screen flex-col">
	<Div class="flex justify-between bg-slate-50/30 backdrop-blur-md dark:bg-slate-50/10">
		<Button isIcon={true} onclick={() => (isNavigationOpen = !isNavigationOpen)} theme="ghost">
			{#if !isNavigationOpen}
				<Menu></Menu>
			{:else}
				<X></X>
			{/if}
		</Button>
	</Div>
	<Div class="relative flex flex-grow flex-col overflow-auto">
		<Div class="flex flex-grow flex-col overflow-auto">
			{#if children}
				{@render children()}
			{/if}
		</Div>
		<Div class="pointer-events-none top-0 left-0 z-10 h-full w-full">
			{#if isNavigationOpen}
				<Button
					class="pointer-events-auto absolute top-0 left-0 h-full w-full"
					isRounded={false}
					onclick={() => (isNavigationOpen = false)}
					tabIndex="-1"
					theme="ghost"
				></Button>
				<Div
					class="pointer-events-auto absolute top-0 left-0 z-10 flex min-h-full w-[calc(100vw_-_3rem)] flex-col bg-slate-50/30 backdrop-blur-md lg:w-auto dark:bg-slate-50/10"
				>
					<Div class="flex flex-grow flex-col">
						{@render tree(navigation)}
					</Div>
					{@render link('/sign-out', 'Sign Out')}
				</Div>
			{/if}
		</Div>
	</Div>
</Div>

{#snippet link(href: string, label: string)}
	<A
		class={twMerge(
			page.url.pathname !== href
				? 'bg-gray-950/0 text-gray-950 hover:bg-gray-950/10 focus:bg-gray-950/10 dark:bg-gray-50/0 dark:text-gray-50 dark:hover:bg-gray-50/10 dark:focus:bg-gray-50/10'
				: undefined
		)}
		{href}
		theme="button">{label}</A
	>
{/snippet}

{#snippet tree(items: Navigation[])}
	<Div class="flex flex-col">
		{#each items as item}
			{#if item.isDirectory}
				<Button
					class="flex items-center justify-between"
					isRounded={false}
					onclick={() => (item.isOpen = !item.isOpen)}
					theme="ghost"
				>
					<Div>
						{item.label}
					</Div>
					<Div class={twMerge('transition duration-200', item.isOpen ? 'rotate-0' : '-rotate-90')}>
						<ChevronDown />
					</Div>
				</Button>
				{#if item.isOpen && item.children.length > 0}
					{@render tree(item.children)}
				{/if}
			{/if}
			{#if !item.isDirectory && item.href}
				{@render link(item.href, item.label)}
			{/if}
		{/each}
	</Div>
{/snippet}
