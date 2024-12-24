<script lang="ts">
	import { Card, Div, InkHero, Logo } from '$lib/components';

	let { children } = $props();
</script>

<Div class="grid flex-grow overflow-auto bg-slate-100 p-6 lg:grid-cols-[1fr_2fr] dark:bg-slate-900">
	<Div class="flex w-full flex-col overflow-auto p-6">
		<Div class="m-auto flex w-full max-w-[20rem] flex-col overflow-visible">
			{@render children()}
		</Div>
	</Div>
	<Card
		class="relative hidden overflow-hidden bg-primary-500 p-0 shadow-none ring-0 lg:flex dark:bg-primary-500 dark:shadow-none dark:ring-0"
	>
		<InkHero />
		<Logo
			class="absolute left-1/2 top-1/2 w-[10rem] -translate-x-1/2 -translate-y-1/2"
			color1class="fill-white dark:fill-white"
			color2class="fill-white dark:fill-white"
		/>
	</Card>
</Div>
