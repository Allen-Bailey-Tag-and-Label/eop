<script lang="ts">
// imports
import { current_component } from 'svelte/internal';
import { twMerge } from 'tailwind-merge';
import { getEvents } from '$actions';
import { Button, Card, Icon, Overlay, Portal } from '$components';
import { theme } from '$stores';
import { fade } from '$transitions';
import { XMark } from 'sveltewind/components/icons';

// props (internal)
const events = getEvents(current_component);

// props (external)
export let close = () => (isOpen = false);
export let duration = 200;
export let isCloseable = true;
export let isOpen = false;
export let open = () => (isOpen = true);
export let style: string | undefined = undefined;
export let toggle = () => (isOpen = !isOpen);
export let use: any[] = [];
</script>

<Portal>
	{#if isOpen}
		<Overlay on:click={() => {if (isCloseable) toggle()}} />
		<div
			class="pointer-events-none fixed left-0 top-0 flex h-[100dvh] w-[100dvw] items-center justify-center p-6 pwa:h-[100vh] pwa:w-[100vw]"
			transition:fade={{duration}}
		>
			<Card
				class={twMerge($theme.modal, 'pointer-events-auto', $$props.class)}
				style={style}
				use={[events, ...use]}
			>
				<slot />
				{#if isCloseable}
					<Button
						class="absolute right-2 top-2"
						on:click={toggle}
						variants={['icon', 'transparent']}
					>
						<Icon src={XMark} />
					</Button>
				{/if}
			</Card>
		</div>
	{/if}
</Portal>
