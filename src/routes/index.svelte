<script>
  // _imports
  import { goto } from '$app/navigation';
  import auth from '$lib/auth';
  import { onMount } from 'svelte';

  onMount(async() => {
    if ( !auth.is.signedin() ) goto('/signin', {replaceState: true});
    if ( auth.is.signedin() ) goto(auth.on.signin(), {replaceState: true});
  });
</script>

<svelte:head>
  <title>Employee Online Portal - Allen-Bailey Tag & Label</title>
</svelte:head>