<script lang="ts">
import { Nav } from 'sveltewind/components';
import { A, NavItem, Overlay } from '$components';
import { fade, slide } from '$transitions';

// props (external)
export let data;
export let close = () => (isOpen = false);
export let isOpen = false;
export let open = () => (isOpen = true);
export let toggle = () => (isOpen = !isOpen);
</script>

{#if isOpen}
	<div transition:fade={{duration:200}}>
		<Overlay on:click={toggle} />
	</div>
	<div
		class="fixed left-auto right-0 top-0 lg:left-0 lg:right-auto"
		transition:slide={{axis:'x',duration:200}}
	>
		<Nav>
			<slot>
				<div class="flex flex-grow flex-col">
					{#each data.user.routes as { href, label }}
						<NavItem href={href} on:click={toggle}>{label}</NavItem>
					{/each}
				</div>
				<NavItem href="/sign-out">Sign Out</NavItem>
			</slot>
		</Nav>
	</div>
{/if}
