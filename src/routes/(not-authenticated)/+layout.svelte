<script lang="ts">
	import { Card, Div, Logo } from '$lib/components';

	let { children } = $props();
</script>

<Div class="grid flex-grow overflow-auto bg-slate-100 p-6 lg:grid-cols-[1fr_2fr] dark:bg-slate-900">
	<Div class="flex w-full flex-col overflow-auto p-6">
		<Div class="m-auto flex w-full max-w-[20rem] flex-col overflow-visible">
			{@render children()}
		</Div>
	</Div>
	<Card
		class="hidden items-center justify-center bg-slate-50 shadow-none ring-0 lg:flex dark:bg-slate-950 dark:shadow-none dark:ring-0"
	>
		<Logo
			class="w-[10rem]"
			color1class="fill-[#282D5B] dark:fill-white"
			color2class="fill-[#8A181D] dark:fill-white"
		/>
	</Card>
</Div>
