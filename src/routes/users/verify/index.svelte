<script context="module">
  export async function load({ page }) {
    // destructure page
    let { query } = page;

    // sanitize query
    query = Object.fromEntries(query);
    
    return {
      props : {
        query
      }
    }
  }
</script>
<script>
  // _imports
  import { goto } from '$app/navigation';
  import { serverFetch } from '$lib/_helpers'
  import auth, { changePassword, getSignInRoute } from '$lib/auth';
  import { onMount } from 'svelte';

  // components
  import { Button, Card, Input, Section, Spinner } from '$components';

  // handlers
  const submitHandler = async () => {
    if ( 
      password.replace(/\s/g, '') === '' ||
      passwordConfirm.replace(/\s/g, '') === ''
    ) return modal.error.show('Passwords cannot be blank.  Please try again.')
    if ( password !== passwordConfirm ) return modal.error.show('New passwords do not match.  Please try again.')
    modal.spinner.show()
    let data = await changePassword(query.accessToken, 'Ennis01', password);
    const { username } = data.user;
    data = await auth.signin({username, password});
    if ( data.error ) {
      modal.spinner.hide();
      modal.error.show(data.error)
    }
    if ( data.accessToken ) {
      // destructure data
      const { accessToken } = data;

      const route = await getSignInRoute(accessToken);

      modal.spinner.hide();
      goto(route)
    }
  }

  // props ( external )
  export let query;

  // props ( internal )
  let password = '';
  let passwordConfirm = '';

  // stores
  import modal from '$components/Modal/store';

  onMount(()=>{

  })
</script>

<Section class="items-center justify-center">
  <form on:submit|preventDefault={submitHandler} class="flex flex-col space-y-[16px] max-w-[500px] w-full mx-auto">
    <Input label="Password" type="password" placeholder="Password" bind:value={password} />
    <Input label="Password ( retype )" type="password" placeholder="Password ( retype )" bind:value={passwordConfirm} />
    <Button type="submit">Change</Button>
  </form>
</Section>