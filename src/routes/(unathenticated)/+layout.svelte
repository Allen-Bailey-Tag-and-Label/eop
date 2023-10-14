<script>
	import { Card, Logo } from '$components';
</script>

<div class="flex flex-col flex-grow min-h-[100dvh] overflow-auto lg:grid lg:grid-cols-2">
	<div class="hidden bg-primary-500 lg:flex items-center justify-center">
		<Logo class="w-[20rem]" fill1="fill-white" fill2="fill-white" />
	</div>
	<Card
		class="flex flex-grow ring-0 p-0 rounded-none shadow-none dark:shadow-none items-center justify-center"
	>
		<Card
			class="overflow-auto justify-center max-w-[30rem] w-full ring-0 rounded-none shadow-none dark:shadow-none"
		>
			<slot />
		</Card>
	</Card>
</div>
