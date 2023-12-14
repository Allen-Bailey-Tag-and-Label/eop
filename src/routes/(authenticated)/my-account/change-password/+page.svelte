<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button, Card, Fieldset, Form, H1, Input, InputGroup, Logo } from '$components';
  import { slide } from '$transitions';
  import { toast } from '$stores';

  // props (external)
  export let form;

  $: if (form?.success) {
    toast('Successfully changed password');
  }
</script>

<div class="flex flex-col items-center justify-center flex-grow p-6">
  <div class="flex flex-col items-center justify-center space-y-8">
    <Card class="w-full">
      <Form use={[enhance]}>
        <InputGroup>
          <Fieldset legend="Current Password">
            <Input name="currentPassword" required="required" type="password" />
          </Fieldset>
          <Fieldset legend="Password">
            <Input name="password" required="required" type="password" />
          </Fieldset>
          <Fieldset legend="Password (Confirmation)">
            <Input name="passwordConfirmation" required="required" type="password" />
          </Fieldset>
          {#if form?.error}
            <div class="text-red-500" transition:slide>{form.error}</div>
          {/if}
        </InputGroup>
        <Button type="submit">Change Password</Button>
      </Form>
    </Card>
  </div>
</div>
