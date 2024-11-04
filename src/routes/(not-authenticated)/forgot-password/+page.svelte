<script lang="ts">
	import { A, Button, Div, Fieldset, Form, H1, Input, P } from '$lib/components';
</script>

<Form class="space-y-8">
	<Div class="flex flex-col items-center space-y-2">
		<H1>Forgot Password 🤔</H1>
		<P class="opacity-50">Enter your credentials below</P>
	</Div>
	<Div class="flex flex-col space-y-4">
		<Fieldset legend="Email">
			<Input name="email" required="required" type="email" />
		</Fieldset>
	</Div>
	<Button type="submit">Request Password Reset</Button>
	<Div class="flex flex-col items-center">
		<P>Remember your password? <A href="/sign-in">Sign In</A></P>
	</Div>
</Form>
