<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button, Card, Fieldset, Form, H1, Input, InputGroup, Logo } from '$components';
  import { slide } from '$transitions';

  // props (external)
  export let form;

  $: console.log(form);
</script>

<div class="flex flex-col items-center space-y-8 p-6">
  <Logo class="w-[4rem] h-[4rem]" />
  <H1 class="px-6">Sign in to your account</H1>
  <Card class="w-full">
    <Form use={[enhance]}>
      <InputGroup>
        <Fieldset legend="Username">
          <Input name="username" required="required" />
        </Fieldset>
        <Fieldset legend="Password">
          <Input name="password" required="required" type="password" />
        </Fieldset>
        {#if form?.error}
          <div class="text-red-500" transition:slide>{form.error}</div>
        {/if}
      </InputGroup>
      <Button type="submit">Sign In</Button>
    </Form>
  </Card>
</div>
