<script>
  // _imports
  import auth, { changePassword } from '$lib/auth';

  // components
  import { Button, Input, Section } from '$components';

  // handlers
  const submitHandler = async () => {
    if ( 
      currentPassword.replace(/\s/g, '') === '' ||
      password.replace(/\s/g, '') === '' ||
      passwordConfirm.replace(/\s/g, '') === ''
    ) return modal.error.show('Passwords cannot be blank.  Please try again.')
    if ( password !== passwordConfirm ) return modal.error.show('New passwords do not match.  Please try again.')
    modal.spinner.show()
    try {
      await changePassword($auth, currentPassword, password);
      modal.spinner.hide();
      modal.success.show('Successfully change password');
    } catch ( error ) {
      modal.spinner.hide();
      modal.error.show(error);
    }
    currentPassword = '';
    password = '';
    passwordConfirm = '';
  }

  // props ( internal )
  let currentPassword = '';
  let password = '';
  let passwordConfirm = '';

  // stores
  import modal from '$components/Modal/store';
</script>

<Section>
  <form on:submit|preventDefault={submitHandler} class="flex flex-col space-y-[16px] max-w-[500px] w-full mx-auto">
    <Input type="password" label="Current Password" placeholder="Current Password" bind:value={currentPassword} />
    <Input type="password" label="New Password" placeholder="New Password" bind:value={password} />
    <Input type="password" label="New Password ( retype )" placeholder="New Password ( retype )" bind:value={passwordConfirm} />
    <Button type="submit">Change</Button>
  </form>
</Section>