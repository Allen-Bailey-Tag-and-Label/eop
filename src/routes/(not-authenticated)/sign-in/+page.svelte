<script lang="ts">
	import { enhance } from '$app/forms';
	import { A, Button, Div, Fieldset, Form, H1, Input, P, ProgressIndicator } from '$lib/components';
	import { cubicInOut } from 'svelte/easing';
	import { scale, slide } from 'svelte/transition';
	import type { ActionData } from './$types';
	import PasswordInput from '$lib/components/PasswordInput.svelte';

	const enhanceHandler = async () => {
		disabled = true;
		return async ({ update }: { update: any }) => {
			disabled = false;
			update();
		};
	};
	let disabled: boolean = $state(false);
	let { form }: { form: ActionData } = $props();
</script>

<Form class="space-y-8" {disabled} use={[[enhance, enhanceHandler]]}>
	<Div class="flex flex-col items-center space-y-2">
		<H1>Welcome Back 👋</H1>
		<P class="opacity-50">Enter your credentials below</P>
	</Div>
	<Div class="flex flex-col space-y-4">
		<Fieldset legend="Username">
			<Input class={form?.error?.inputClasses?.username} name="username" required={true} />
		</Fieldset>
		<Fieldset legend="Password">
			<PasswordInput class={form?.error?.inputClasses?.password} name="password" required={true} />
		</Fieldset>
		{#if form?.error?.message}
			<Div class="text-red-500" transition={[slide, { axis: 'y', duration: 200 }]}
				>{form.error.message}</Div
			>
		{/if}
	</Div>
	<Button class="relative" {disabled} type="submit">
		{#if disabled}
			<ProgressIndicator
				class="h-6 w-6"
				transition={[scale, { duration: 200, easing: cubicInOut, opacity: 1, start: 0 }]}
			/>
		{:else}
			<Div transition={[scale, { duration: 200, easing: cubicInOut, opacity: 1, start: 0 }]}
				>Sign In</Div
			>
		{/if}
	</Button>
	<Div class="flex flex-col items-center">
		<P>Forgot your password? <A href="/forgot-password">Reset Password</A></P>
	</Div>
</Form>
