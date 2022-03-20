<script>
	// imports
	import { goto } from '$app/navigation';
	import { A, SubmitButton, Card, Fieldset, Form, H3, Input, Logo, P } from '@components';
	import { auth, socket } from '@stores';

	// handlers
	const submitHandler = async (e) => {
		e.preventDefault();
		if (!submitted)
			await new Promise((res) => {
				submitted = true;
				errorMessage = '';
				socket.emit('authSignin', { password, username }, ({ error, token }) => {
					if (error) errorMessage = error;
					if (!error) {
						auth.set(token);
						goto('/dashboard');
					}
					submitted = false;
					res();
				});
			});
	};

	// props (internal)
	let errorMessage = '';
	let password = '';
	let submitted = false;
	let username = '';
</script>

<div class="flex flex-col flex-grow items-center justify-center p-[1.5rem] space-y-[2rem]">
	<Logo class="mx-auto" />
	<Card class="w-full max-w-sm">
		<Form on:submit={submitHandler}>
			<H3 class="text-center">Signin</H3>
			<Fieldset legend="Username">
				<Input bind:value={username} />
			</Fieldset>
			<Fieldset legend="Password">
				<Input bind:value={password} type="password" />
			</Fieldset>
			<P class="text-red-500">{errorMessage}</P>
			<SubmitButton bind:submitted type="submit">Signin</SubmitButton>
		</Form>
	</Card>
	<A href="/forgot-password">Forgot password?</A>
</div>
