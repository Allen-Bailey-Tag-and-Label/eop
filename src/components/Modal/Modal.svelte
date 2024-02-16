<script lang="ts">
// imports
import { current_component } from 'svelte/internal';
import { twMerge } from 'tailwind-merge';
import { getEvents } from '$actions';
import { Card, Overlay, Portal } from '$components';
import { theme } from '$stores';

// props (internal)
const events = getEvents(current_component);

// props (external)
export let close = () => (isOpen = false);
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
		<div class="pwa:w-[100vw] pwa:h-[100vh] fixed left-0 top-0 h-[100dvh] w-[100vh]">
			<Card class={twMerge($theme.modal, $$props.class)} style={style} use={[events, ...use]}>
				<slot />
			</Card>
		</div>
	{/if}
</Portal>
