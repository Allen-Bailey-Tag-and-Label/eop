<script>
  import { goto } from '$app/navigation';
  import { A, Button, Fieldset, Form, H5, Input } from '$components';
  import { postFetch } from '$lib/helpers';

  // handlers
  const submitHandler = async (e) => {
    e.preventDefault();
    error = '';
    const response = await postFetch({ body: { password, username }, url: '/signin' });
    if (!response.ok) return (error = 'Credentials could not be verified.');
    return goto(response.url);
  };

  // props (internal)
  let error = '';
  let password = '';
  let username = '';

  // props (external)
  export let data;
  export let errors;
</script>

<Form on:submit={submitHandler}>
  <H5>Signin</H5>
  <Fieldset legend="Username">
    <Input bind:value={username} name="username" />
  </Fieldset>
  <Fieldset legend="Password">
    <Input bind:value={password} name="password" type="password" />
  </Fieldset>
  <div class="min-h-[1.5rem] text-red-500 selection:bg-red-500">{error}</div>
  <Button type="submit">Signin</Button>
  <div class="flex items-center justify-end">
    <A href="/forgot-password">Forgot Password?</A>
  </div>
</Form>
