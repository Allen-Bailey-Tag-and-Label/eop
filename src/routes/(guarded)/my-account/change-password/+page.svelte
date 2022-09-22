<script>
  import { Button, Fieldset, Form, Input, TitleBar } from '$components';
  import { postFetch } from '$lib/helpers';

  // props (internal)
  let currentPassword = '';
  let password = '';
  let passwordConfirm = '';

  // props (external)
  export let form;
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">My Account - Change Password</svelte:fragment>
  </TitleBar>
  <div class="flex flex-grow items-center justify-center p-[2rem] overflow-y-auto">
    <Form>
      <Fieldset legend="Current Password">
        <Input bind:value={currentPassword} name="currentPassword" type="password" />
      </Fieldset>
      <Fieldset legend="New Password">
        <Input bind:value={password} name="password" type="password" />
      </Fieldset>
      <Fieldset legend="New Password (retype)">
        <Input bind:value={passwordConfirm} name="passwordConfirm" type="password" />
      </Fieldset>
      {#if form?.error}
        <div class="min-h-[1.5rem] text-red-500 selection:bg-red-500">
          {form.error.message}
        </div>
      {:else if form?.success}
        <div class="min-h-[1.5rem] text-green-500 selection:bg-green-500">
          {form.message}
        </div>
      {/if}
      <Button type="submit">Change Password</Button>
    </Form>
  </div>
</div>
