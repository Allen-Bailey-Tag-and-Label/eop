<script lang="ts">
import { Nav, Portal } from 'sveltewind/components';
import { twMerge } from 'tailwind-merge';
import { Button, Icon, NavItem, Overlay } from '$components';
import { ChevronDown } from '$icons';
import { fade, slide } from '$transitions';
import { theme } from '$stores';

// helpers
const sortGroups = ([a], [b]) => {
	if (a === '' || a === null || a === undefined) return -1;
	if (b === '' || b === null || b === undefined) return 1;
	return a.localeCompare(b);
};

// props (external)
export let data;
export let close = () => (isOpen = false);
export let isOpen = false;
export let open = () => (isOpen = true);
export let toggle = () => (isOpen = !isOpen);
</script>

<Portal>
	{#if isOpen}
		<div class="absolute left-0 top-0 z-[2] h-full w-full" transition:fade={{duration:200}}>
			<Overlay on:click={toggle} />
		</div>
		<div
			class="fixed left-auto right-0 top-0 z-[2] lg:left-0 lg:right-auto"
			transition:slide={{axis:'x',duration:200}}
		>
			<Nav class="min-w-[20rem] space-y-6">
				<slot>
					<div class="flex flex-grow flex-col space-y-6">
						{#each new Map([...data.user.routes.entries()].sort(sortGroups)) as [group, { isOpen, routes }]}
							<div class="flex flex-col">
								{#if group !== '' && group !== null && group !== undefined}
									<Button
										class={twMerge($theme.navItem, 'relative flex justify-start rounded-none pl-6 text-base font-bold lg:pl-16')}
										on:click={() => isOpen = !isOpen}
										variants={['transparent']}
									>
										<div>
											{group}
										</div>
										<Icon
											class={twMerge("absolute right-6 top-1/2 h-4 w-4 -translate-y-1/2 transition duration-200", isOpen ? 'rotate-180' : 'rotate-0')}
											src={ChevronDown}
										/>
									</Button>
								{/if}
								{#if isOpen || group === '' || group === null || group === undefined}
									<div class="flex flex-col" transition:slide>
										{#each routes as [_, { href, label }]}
											<NavItem href={href} on:click={toggle}>{label}</NavItem>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
					<NavItem href="/sign-out">Sign Out</NavItem>
				</slot>
			</Nav>
		</div>
	{/if}
</Portal>
