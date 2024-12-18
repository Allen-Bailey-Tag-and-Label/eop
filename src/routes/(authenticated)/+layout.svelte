<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import { A, Button, Card, Div, Drawer, Header, Icon } from '$lib/components';
	import type { Snippet } from 'svelte';
	import type { LayoutServerData } from '../$types.js';
	import { ChevronDown } from 'sveltewind/icons';
	import { theme } from 'sveltewind';

	type Props = {
		children: Snippet;
		data: LayoutServerData;
	};
	let { children, data }: Props = $props();
	let isVisible = $state(false);
	let navigationGroups: {
		isVisible: boolean;
		group: string;
		groupItems: {
			href: string;
			label: string;
		}[];
	}[] = $state([]);
	const toggle = () => {
		isVisible = !isVisible;
	};
	const updateNavigationGroups = (navigation: Map<string, Map<string, string>>) => {
		navigationGroups = Array.from(navigation)
			.map(([group, groupItems]) => ({
				isVisible: group === '' ? true : false,
				group,
				groupItems: Array.from(groupItems)
					.map(([href, label]) => ({ href, label }))
					.sort((a, b) => a.label.localeCompare(b.label))
			}))
			.sort((a, b) => {
				if (a.group === '') return -1;
				if (b.group === '') return 1;
				return a.group.localeCompare(b.group);
			});
	};

	$effect(() => {
		updateNavigationGroups(data.navigation);
	});
</script>

<Div class="flex flex-grow flex-col overflow-auto lg:flex-row">
	<Header class="items-start p-4 pwa:order-2 lg:pwa:order-1">
		<Button class="relative z-[100] w-12" onclick={toggle} variants={['default', 'icon']}>
			<Div
				class={twMerge(
					'absolute left-1/2 top-1/2 h-[1px] w-[50%] -translate-x-1/2 bg-current transition duration-200',
					isVisible ? 'translate-y-0 rotate-45' : 'translate-y-[-.25rem]'
				)}
			/>
			<Div
				class={twMerge(
					'absolute left-1/2 top-1/2 h-[1px] w-[50%] -translate-x-1/2 bg-current transition duration-200',
					isVisible ? 'translate-y-0 -rotate-45' : 'translate-y-[.25rem]'
				)}
			/>
		</Button>
		<Drawer
			bind:isVisible
			class="w-full max-w-[calc(100dvw_-_2rem)] lg:w-auto lg:min-w-[20rem] lg:max-w-full"
			position="left"
		>
			<Card
				class="flex flex-grow flex-col divide-slate-200 overflow-auto rounded-none px-0 py-4 pt-20 pwa:pb-20 pwa:pt-4 dark:divide-slate-700"
			>
				{#each navigationGroups as navigationGroup, navigationGroupIndex}
					<Div class="flex flex-col py-3">
						{#if navigationGroup.group !== ''}
							<Button
								class="items-center justify-between rounded-none text-base dark:shadow-none"
								onclick={() =>
									(navigationGroups[navigationGroupIndex].isVisible =
										!navigationGroups[navigationGroupIndex].isVisible)}
								variants={['default', 'ghost']}
							>
								<Div>
									{navigationGroup.group}
								</Div>
								<Icon
									class={twMerge(
										'h-4 w-4 transition duration-200',
										navigationGroup.isVisible ? 'rotate-180' : 'rotate-0'
									)}
									src={ChevronDown}
								/>
							</Button>
						{/if}
						<Div class="flex flex-col pl-6" isVisible={navigationGroup.isVisible}>
							{#each navigationGroup.groupItems as { href, label }}
								<A
									class={twMerge(
										theme.getComponentVariant('button', 'default'),
										theme.getComponentVariant('button', 'ghost'),
										'justify-start rounded-none border-l border-slate-200 text-base font-normal opacity-70 hover:text-current hover:opacity-100 hover:shadow-none focus:text-current focus:opacity-100 focus:shadow-none dark:border-slate-700 dark:shadow-none'
									)}
									{href}
									onclick={() => {
										isVisible = false;
									}}
								>
									{label}
								</A>
							{/each}
						</Div>
					</Div>
				{/each}
			</Card>
		</Drawer>
	</Header>
	<Div class="flex flex-grow flex-col overflow-auto">
		{@render children()}
	</Div>
</Div>
