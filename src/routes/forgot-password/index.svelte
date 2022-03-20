<script>
	// imports
	import { A, Button, Card, Fieldset, Form, H5, Input, Logo } from '@components';

	// handlers
	const submitHandler = (e) => {
		e.preventDefault();
	};

	// props (internal)
	let username = '';
</script>

<div class="flex flex-col flex-grow items-center justify-center p-[1.5rem] space-y-[2rem]">
	<Logo class="mx-auto" />
	<Card class="w-full max-w-sm">
		<Form on:submit={submitHandler}>
			<H5 class="text-center">Forgot Password</H5>
			<Fieldset legend="Username">
				<Input bind:value={username} />
			</Fieldset>
			<Button type="submit">Reset Password</Button>
		</Form>
	</Card>
	<A href="/signin">Signin</A>
</div>
