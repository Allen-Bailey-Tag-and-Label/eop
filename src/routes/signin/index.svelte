<script>
	// imports
	import { A, Button, Card, Fieldset, Form, H3, Input, Logo } from '@components';

	// handlers
	const submitHandler = (e) => {
		e.preventDefault();
	};

	// props (internal)
	let password = '';
	let username = '';
</script>

<div class="flex flex-col flex-grow items-center justify-center p-[1.5rem] space-y-[2rem]">
	<Logo class="mx-auto" />
	<Card class="w-full max-w-md">
		<Form on:submit={submitHandler}>
			<H3 class="text-center">Signin</H3>
			<Fieldset legend="Username">
				<Input bind:value={username} />
			</Fieldset>
			<Fieldset legend="Password">
				<Input bind:value={password} type="password" />
			</Fieldset>
			<Button type="submit">Signin</Button>
		</Form>
	</Card>
	<A>Forgot password?</A>
</div>
