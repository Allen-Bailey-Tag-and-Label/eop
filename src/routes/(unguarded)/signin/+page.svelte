<script>
  import { enhance } from '$app/forms';
  import { A, Button, Fieldset, Form, H5, Input } from '$components';

  // props (internal)
  let password = '';
  let username = '';

  // props (external)
  export let form;
</script>

<Form use={[enhance]}>
  <H5>Signin</H5>
  <Fieldset legend="Username">
    <Input bind:value={username} name="username" />
  </Fieldset>
  <Fieldset legend="Password">
    <Input bind:value={password} name="password" type="password" />
  </Fieldset>
  <div class="min-h-[1.5rem] text-red-500 selection:bg-red-500">
    {#if form?.error}
      {form.error.message}
    {/if}
  </div>
  <Button type="submit">Signin</Button>
  <div class="flex items-center justify-end">
    <A href="/forgot-password">Forgot Password?</A>
  </div>
</Form>
