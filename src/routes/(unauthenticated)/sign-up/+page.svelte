<script lang="ts">
import { enhance } from '$app/forms';
import { A, Button, Fieldset, Form, H1, Input, P } from '$components';
import { slide } from '$transitions';

// props (external)
export let form;
</script>

<div class="flex flex-col items-center space-y-1">
	<H1>Let's get started</H1>
	<P class="opacity-70">Please enter your details below.</P>
</div>
<Form class="w-full max-w-[25rem] lg:space-y-6" use={[enhance]}>
	<div class="flex flex-col space-y-2 lg:space-y-3">
		<Fieldset legend="Username">
			<Input name="username" required="required" />
		</Fieldset>
		<Fieldset legend="Password">
			<Input name="password" required="required" type="password" />
		</Fieldset>
	</div>
	{#if form?.error}
		<div class="text-red-500" transition:slide>{form.error}</div>
	{/if}
	<Button type="submit">Sign Up</Button>
</Form>
<div class="text-center">
	Already have an account? <A href="/sign-in">Sign In</A>
</div>
