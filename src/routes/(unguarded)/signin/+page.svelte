<script>
  import { applyAction, enhance } from '$app/forms';
  import { A, ButtonSubmit, Fieldset, Form, H5, Input } from '$components';

  // props (internal)
  let password = '';
  let submitted = false;
  let username = '';

  // props (external)
  export let form;
</script>

<Form
  use={[
    [
      enhance,
      () => {
        form = {};
        submitted = true;
        return async ({ result }) => {
          await applyAction(result);
          if (result.type === 'invalid') submitted = false;
        };
      }
    ]
  ]}
>
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
  <ButtonSubmit {submitted}>Signin</ButtonSubmit>
  <div class="flex items-center justify-end">
    <A href="/forgot-password">Forgot Password?</A>
  </div>
</Form>
