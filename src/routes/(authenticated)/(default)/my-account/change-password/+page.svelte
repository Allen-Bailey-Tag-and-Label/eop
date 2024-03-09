<script>
import { enhance } from '$app/forms';
import { Button, Card, Fieldset, Form, Input } from '$components';
import { slide } from '$transitions';

// props (external)
export let form;
$: console.log(form);
</script>

<div class="flex flex-grow flex-col lg:items-center lg:justify-center lg:overflow-auto">
	<Card>
		<Form use={[enhance]}>
			<Fieldset legend="Current Password">
				<Input name="currentPassword" required="required" type="password" />
			</Fieldset>
			<Fieldset legend="New Password">
				<Input name="newPassword" required="required" type="password" />
			</Fieldset>
			<Fieldset legend="Password Confirm">
				<Input name="passwordConfirm" required="required" type="password" />
			</Fieldset>
			{#if form?.error}
				<div class="text-red-500" transition:slide>
					{form.error}
				</div>
			{/if}
			{#if form?.success}
				<div class="text-green-500" transition:slide>Successfully updated password</div>
			{/if}
			<Button class="lg:self-end" type="submit">Change Password</Button>
		</Form>
	</Card>
</div>
