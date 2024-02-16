<script lang="ts">
import { Header } from 'sveltewind/components';
import { twMerge } from 'tailwind-merge';
import { Button, Nav } from '$components';

// props (external)
export let data;

// props (internal)
let close: () => boolean;
let isOpen: boolean;
let open: () => boolean;
let toggle: () => boolean;
</script>

<Header class={"pwa:order-2 pwa:pb-[env(safe-area-inset-bottom)]"}>
	<slot>
		<Button
			class="relative z-[1] h-[3rem] w-[3rem] text-current"
			on:click={toggle}
			variants={['icon', 'transparent']}
		>
			{#each [{false:'translate-y-[calc(-50%_+_.1875rem)]', true:'-translate-y-1/2 rotate-45'}, {false:'translate-y-[calc(-50%_-_.1875rem)]', true:'-translate-y-1/2 -rotate-45'}] as classes}
				<div
					class={twMerge("absolute left-1/2 top-1/2 h-[1.5px] w-[1rem] -translate-x-1/2 rounded-full bg-current transition duration-200", classes[isOpen])}
				/>
			{/each}
		</Button>
		<Nav
			bind:close={close}
			bind:isOpen={isOpen}
			bind:open={open}
			bind:toggle={toggle}
			data={data}
		/>
	</slot>
</Header>
