<script>
	import { twMerge } from 'tailwind-merge';
	import { enhance } from '$app/forms';
	import { A, Button, Fieldset, Form, Input } from '$components';
	import { theme } from '$stores';
	import { slide } from 'svelte/transition';

	// props (external)
	export let form;

	// props (internal)
	let password = '';
	let username = '';
</script>

<Form class="space-y-[3rem]" use={[enhance]}>
	<img alt="Logo" class="mx-auto w-[6rem] h-[6rem]" src="/icon.svg" />
	<div class="text-[1.5rem] font-semibold">Sign In to Continue</div>
	<div class="flex flex-col space-y-[1rem]">
		<Fieldset legend="Username">
			<Input
				bind:value={username}
				class={form?.error?.username === true
					? 'ring-offset-red-500 dark:ring-offset-red-500'
					: undefined}
				name="username"
				required="required"
			/>
		</Fieldset>
		<Fieldset legend="Password">
			<Input
				bind:value={password}
				class={form?.error?.password === true
					? 'ring-offset-red-500 dark:ring-offset-red-500'
					: undefined}
				name="password"
				required="required"
				type="password"
			/>
		</Fieldset>
		{#if form?.error?.message}
			<div class="text-red-500" transition:slide>
				{form?.error?.message}
			</div>
		{/if}
	</div>
	<A
		class={twMerge(
			$theme.button,
			$theme.a,
			'text-current bg-transparent hover:bg-primary-500/[.1] focus:bg-primary-500/[.1] rounded-none self-center hover:rounded focus:rounded focus:shadow-none dark:focus:shadow-none text-center'
		)}
		href="/forgot-password">Forgot Password?</A
	>
	<Button type="submit">Sign In</Button>
</Form>
