<script>
  import { Button, Fieldset, Form, Input, TitleBar } from '$components';
  import { postFetch } from '$lib/helpers';

  // utilities

  // handlers
  const submitHandler = async (e) => {
    e.preventDefault();
    error = '';
    errorClasses = 'text-red-500 selection:bg-red-500';
    // check if new passwords do not match
    if (password !== passwordConfirm) return (error = 'New passwords do not match.');

    const response = await postFetch({
      body: { currentPassword, password, passwordConfirm },
      url: '/api/auth/change-password'
    });
    if (!response.ok) return ({ error } = await response.json());
    const { message } = await response.json();
    error = message;
    errorClasses = 'text-green-500 selection:bg-green-500';
    currentPassword = '';
    password = '';
    passwordConfirm = '';
  };

  // props (internal)
  let currentPassword = '';
  let error = '';
  let errorClasses = 'text-red-500 selection:bg-red-500';
  let password = '';
  let passwordConfirm = '';

  // props (external)
  export let data;
  export let errors;

  // props (dynamic)
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">My Account - Change Password</svelte:fragment>
  </TitleBar>
  <div class="flex flex-grow items-center justify-center p-[2rem] overflow-y-auto">
    <Form on:submit={submitHandler}>
      <Fieldset legend="Current Password">
        <Input bind:value={currentPassword} type="password" />
      </Fieldset>
      <Fieldset legend="New Password">
        <Input bind:value={password} type="password" />
      </Fieldset>
      <Fieldset legend="New Password (retype)">
        <Input bind:value={passwordConfirm} type="password" />
      </Fieldset>
      <div class="min-h-[1.5rem] {errorClasses}">{error}</div>
      <Button type="submit">Change Password</Button>
    </Form>
  </div>
</div>
