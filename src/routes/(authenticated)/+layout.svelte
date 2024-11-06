<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import { Button, Card, Div, Drawer, Header } from '$lib/components';

	let { children } = $props();
	let isVisible = $state(false);
	const toggle = () => {
		isVisible = !isVisible;
	};
</script>

<Div class="flex flex-grow flex-col overflow-auto lg:flex-row">
	<Header class="items-start p-4 pwa:order-2 lg:pwa:order-1">
		<Button class="relative z-[100]" onclick={toggle} variants={['default', 'icon']}>
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
			class="w-full min-w-[20rem] max-w-[calc(100dvw_-_2rem)] lg:w-auto lg:max-w-full"
			position="left"
		>
			<Card
				class="flex flex-grow flex-col overflow-auto rounded-none px-4 py-4 pt-20 pwa:pb-20 pwa:pt-4"
			>
				{#each [...Array(100)] as _}
					Nav Item<br />
				{/each}
			</Card>
		</Drawer>
	</Header>
	<Div class="flex flex-grow flex-col overflow-auto">
		{@render children()}
	</Div>
</Div>
