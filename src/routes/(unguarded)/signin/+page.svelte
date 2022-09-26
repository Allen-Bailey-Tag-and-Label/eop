<script>
  import { enhance } from '$app/forms';
  import { A, Button, Fieldset, Form, H5, Input } from '$components';

  const submitHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('password', password);
    formData.append('username', username);
    const response = await fetch('/signin', { body: formData, method: 'POST' });
    console.log(response);
  };

  // props (internal)
  let password = '';
  let username = '';

  // props (external)
  export let form;
</script>

<Form on:submit={submitHandler} use={[]}>
  <!-- <Form use={[enhance]}> -->
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
