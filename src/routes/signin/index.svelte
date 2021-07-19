<script>
  // _imports
  import { goto } from '$app/navigation';
  import auth, { getSignInRoute } from '$lib/auth';
  import { onMount } from 'svelte';

  // components
  import { Button, Card, Container, Input, Section, Spinner } from '$components'

  // handlers
  const submitHandler = async () => {
    modal.spinner.show();
    let data = await auth.signin({email, password});
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

  // props ( internal )
  let email = '';
  let password = '';
  let loaded = false;

  // stores
  import modal from '$components/Modal/store';

  onMount(() => loaded = true)
</script>

<svelte:head>
  <title>Signin - Employee Online Portal - Allen-Bailey Tag & Label</title>
</svelte:head>

<Section padding="" class="relative flex-grow justify-center">
  <Container class="flex justify-center">
    {#if loaded}
      <Card class="max-w-[500px] w-full">
        <form on:submit|preventDefault={submitHandler} class="flex flex-col space-y-[36px]">
          <div class="font-bold text-[36px]">Sign In</div>
          <div class="flex flex-col space-y-[16px]">
            <Input label="Email" name="email" type="email" placeholder="Email" bind:value={email} />
            <Input label="Password" name="password" type="password" placeholder="Password" bind:value={password} />
          </div>
          <Button type="submit">Sign In</Button>
        </form>
      </Card>
    {:else}
      <Card>
        <Spinner />
      </Card>
    {/if}
  </Container>
</Section>