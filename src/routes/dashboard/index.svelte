<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  // import { goto } from '$app/navigation';
  import { H1, Route } from '$components'
  // import { socket } from '$stores';

  // utilities

  // handlers

  // props (internal)

  // props (external)

  // props (dynamic)

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

<Route class='items-start justify-start'>
  <H1>Dashboard</H1>
</Route>

<slot/>