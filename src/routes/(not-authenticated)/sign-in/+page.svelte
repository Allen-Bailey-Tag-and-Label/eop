<script lang="ts">
	import { A, Button, Div, Fieldset, Form, H1, Input, P } from '$lib/components';
</script>

<Form class="space-y-8">
	<Div class="flex flex-col items-center space-y-2">
		<H1>Welcome Back 👋</H1>
		<P class="opacity-50">Enter your credentials below</P>
	</Div>
	<Div class="flex flex-col space-y-4">
		<Fieldset legend="Email">
			<Input name="email" required="required" type="email" />
		</Fieldset>
		<Fieldset legend="Password">
			<Input name="password" required="required" type="password" />
		</Fieldset>
	</Div>
	<Button type="submit">Sign In</Button>
	<Div class="flex flex-col items-center">
		<P>Forgot your password? <A href="/forgot-password">Reset Password</A></P>
	</Div>
</Form>
