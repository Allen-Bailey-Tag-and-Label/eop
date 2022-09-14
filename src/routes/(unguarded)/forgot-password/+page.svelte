<script>
  import { A, Button, Fieldset, Form, H5, Input } from '$components';
  import { postFetch } from '$lib/helpers';

  // handlers
  const submitHandler = async (e) => {
    e.preventDefault();
    const response = await postFetch({ body: { password, username }, url: '/forgot-password' });
  };

  // props (internal)
  let username = '';

  // props (external)
  export let data;
  export let errors;
</script>

<Form on:submit={submitHandler}>
  <H5>Forgot Password</H5>
  <Fieldset legend="Username">
    <Input bind:value={username} name="username" />
  </Fieldset>
  <Button type="submit">Request Password Reset</Button>
  <div class="flex items-center justify-end">
    <A href="/signin">Signin</A>
  </div>
</Form>
