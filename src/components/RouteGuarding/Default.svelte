<script>
  // imports
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { token, socket } from '$stores';
  import unguardedRoutes from './unguardedRoutes.js';

  // utilities
  const guardRoute = async () => {
    if ($socket !== undefined && !unguardedRoutes.includes($page.url.pathname)) {
      // verify token
      const verified = await token.verify();

      // reroute if not verified
      if (!verified) goto('/signin')
    }
  }

  // handlers

  // props (internal)

  // props (external)

  // props (dynamic)
  $: if ( $socket !== undefined ) guardRoute();

  // lifecycle
  const lifecycle = {
    destroy : () => {},
    mount : async () => {},
  }
  onMount(async() => {
    await lifecycle.mount();
    return () => {
      lifecycle.destroy();
    }
  })
</script>

<slot/>