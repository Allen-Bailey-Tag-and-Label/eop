<script lang="ts">
import { Header } from 'sveltewind/components';
import { twMerge } from 'tailwind-merge';
import { Button, Nav, Portal } from '$components';

// props (external)
export let data;

// props (internal)
let close: () => boolean;
let isOpen: boolean;
let open: () => boolean;
let toggle: () => boolean;
</script>

<Header>
	<slot>
		<Portal>
			<Button
				class="fixed right-0 top-0 z-[3] h-[3rem] w-[3rem] pwa:bottom-[env(safe-area-inset-bottom)] pwa:top-auto lg:left-0 lg:right-auto pwa:lg:bottom-auto pwa:lg:top-0"
				on:click={toggle}
				variants={['icon', 'transparent']}
			>
				{#each [{false:'translate-y-[calc(-50%_+_.1875rem)]', true:'-translate-y-1/2 rotate-45'}, {false:'translate-y-[calc(-50%_-_.1875rem)]', true:'-translate-y-1/2 -rotate-45'}] as classes}
					<div
						class={twMerge("absolute left-1/2 top-1/2 h-[1.5px] w-[1rem] -translate-x-1/2 rounded-full bg-current transition duration-200", classes[isOpen])}
					/>
				{/each}
			</Button>
		</Portal>
		<Button
			class="pointer-events-none h-[3rem] w-[3rem] opacity-0"
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
