<script lang="ts">
	import { untrack } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { ChevronDown, Menu, PanelLeft, X } from '@lucide/svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { A, Button, Card, Div, Header } from '$lib/components';
	import { theme } from '$lib/theme';
	import { type Navigation, type User } from '$lib/types.js';
	import { slide } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';

	let { children, data } = $props();
	let isNavigationOpen = $state(false);
	let navigation: Navigation[] = $state([]);
	const magnificationMap = new Map([
		[10, 'text-[10px]'],
		[11, 'text-[11px]'],
		[12, 'text-[12px]'],
		[13, 'text-[13px]'],
		[14, 'text-[14px]'],
		[15, 'text-[15px]'],
		[16, 'text-[16px]'],
		[17, 'text-[17px]'],
		[18, 'text-[18px]'],
		[19, 'text-[19px]'],
		[20, 'text-[20px]'],
		[21, 'text-[21px]'],
		[22, 'text-[22px]']
	]);
	let user: User = $state({
		_id: '',
		branches: [],
		defaultBranch: { _id: '', label: '', number: 0 },
		isActive: true,
		profile: { _id: '', email: '', firstName: '', lastName: '', phone: 0 },
		settings: { _id: '', magnification: 16, theme: 'elegant-midnight' },
		username: ''
	});

	$effect(() => {
		navigation = data.locals.navigation;
		user = data.locals.user;

		untrack(() => {
			if (browser) {
				const magnification = magnificationMap.get(user.settings.magnification);
				if (magnification) document.documentElement.className = magnification;
				document.documentElement.setAttribute('theme', user.settings.theme);
			}
		});
	});
</script>

<Div class="flex max-h-screen min-h-screen max-w-screen min-w-screen flex-col overflow-auto">
	<Header
		class="sticky bottom-0 z-10 order-2 flex items-center justify-between lg:top-0 lg:order-1"
	>
		<Button onclick={() => (isNavigationOpen = !isNavigationOpen)} variants={['ghost', 'icon']}>
			<PanelLeft size={(user.settings.magnification * 24) / 16} />
		</Button>
		<Div class="px-6">
			{user.profile.firstName}
			{user.profile.lastName}
		</Div>
	</Header>
	<Div class="relative order-1 flex flex-grow flex-col overflow-auto lg:order-2">
		<Div class="pointer-events-none top-0 left-0 z-10 h-full w-full">
			{#if isNavigationOpen}
				<Button
					class={twMerge(
						'pointer-events-auto absolute top-0 left-0 h-full w-full backdrop-blur-none'
					)}
					onclick={() => (isNavigationOpen = false)}
					tabindex={-1}
					variants={['ghost', 'square']}
				/>
			{/if}
			<Card
				class={twMerge(
					'pointer-events-auto absolute top-0 left-0 z-10 max-h-full min-h-full w-[calc(100vw_-_3rem)] overflow-auto rounded-none p-0 pt-[env(safe-area-inset-top)] transition duration-200 lg:w-auto lg:min-w-[20rem] lg:pt-0 lg:pb-[env(safe-area-inset-bottom)]',
					isNavigationOpen ? 'translate-x-0' : '-translate-x-full'
				)}
				inert={isNavigationOpen ? undefined : true}
			>
				<Div class="flex flex-grow flex-col">
					{@render tree(navigation)}
				</Div>
				{@render link('/sign-out', 'Sign Out')}
			</Card>
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
			$theme.Button.default,
			'block rounded-none text-left backdrop-blur-none outline-solid hover:no-underline focus:no-underline',
			page.url.pathname !== href ? $theme.Button.ghost : undefined
		)}
		{href}
		onclick={() => {
			isNavigationOpen = false;
		}}
	>
		<Div>
			{label}
		</Div>
	</A>
{/snippet}

{#snippet tree(items: Navigation[], depth: number = 0)}
	<Div
		class={twMerge(
			'flex flex-col',
			depth > 0 ? 'border-l border-white/[.5] dark:border-white/[0.25]' : undefined
		)}
	>
		{#each items as item}
			{#if item.children.length > 0}
				<Button
					class={twMerge('flex items-center justify-between backdrop-blur-none')}
					onclick={() => (item.isOpen = !item.isOpen)}
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
					<Div class={twMerge('flex flex-col pl-6')}>
						{@render tree(item.children, depth + 1)}
					</Div>
				{/if}
			{/if}
			{#if item.children.length === 0 && item.href}
				{@render link(item.href, item.label, depth)}
			{/if}
		{/each}
	</Div>
{/snippet}
