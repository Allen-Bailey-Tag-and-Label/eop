<script>
	import { twMerge } from 'tailwind-merge';
	import { Button, Card, Header, Nav, Overlay } from '$components';
	import { theme } from '$stores';

	// props (external)
	export let data;

	// props (internal)
	const nav = {
		close: () => (nav.isOpen = false),
		iconClasses: {
			false: ['translate-y-[calc(-50%_-_.25rem)]', 'translate-y-[calc(-50%_+_.25rem)]'],
			true: ['-translate-y-1/2 rotate-45', '-translate-y-1/2 -rotate-45']
		},
		isOpen: false,
		open: () => (nav.isOpen = true),
		toggle: () => (nav.isOpen = !nav.isOpen)
	};
	const routes = [
		{ href: '/dashboard', group: null, name: 'Dashboard' },
		{ href: '/styleguide', group: null, name: 'Styleguide' },
		{ href: '/admin/routes', group: 'Admin', name: 'Routes' }
	];
	$: groupedRoutesObj = routes.reduce((obj, { href, group, name }) => {
		// check if group is null
		if (group === null) group = '';

		// check if group not in obj
		if (obj?.[group] === undefined) obj[group] = [];

		// add route to group
		obj[group].push({ href, name });

		return obj;
	}, {});
	$: groupedRoutes = Object.keys(groupedRoutesObj)
		.map((group) => {
			return {
				group,
				children: groupedRoutesObj[group].sort((a, b) => a.name.localeCompare(b.name))
			};
		})
		.sort((a, b) => a?.group.localeCompare(b?.group));
</script>

<div class="flex flex-col flex-grow overflow-auto max-h-[100dvh]">
	<div class="flex flex-col flex-grow overflow-auto pt-[env(safe-area-inset-top)]">
		<slot />
	</div>
	<Header class="pb-[env(safe-area-inset-bottom)]">
		<Button
			class={twMerge($theme.buttonIcon, $theme.buttonTransparent, 'z-[3]')}
			on:click={nav.toggle}
		>
			<div class="w-[1.5rem] h-[1.5rem] relative">
				{#each [...Array(2)] as _, i}
					<div
						class={twMerge(
							'h-[0.09375rem] transition duration-200 rounded-full w-[1.125rem] absolute bg-gray-800 dark:bg-white top-1/2 left-1/2 -translate-x-1/2',
							nav.iconClasses[nav.isOpen][i]
						)}
					/>
				{/each}
			</div>
		</Button>
		<Overlay
			class={twMerge(
				nav.isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
			)}
			on:click={nav.close}
		/>
		<Card
			class={twMerge(
				'fixed rounded-none top-0 right-0 min-h-[100dvh] max-h-[100dvh] min-w-[calc(100dvw_-_2rem)] overflow-auto pt-[env(safe-area-inset-top)] px-0 pb-[env(safe-area-inset-bottom)] transition duration-200',
				nav.isOpen ? 'translate-x-0' : 'translate-x-full'
			)}
		>
			<Nav>
				{#each groupedRoutes as { group, children }}
					{#if group !== ''}
						<div>{group}</div>
					{/if}
					{#each children as { href, name }}
						<a {href} on:click={nav.close}>{name}</a>
					{/each}
				{/each}
			</Nav>
		</Card>
	</Header>
</div>
