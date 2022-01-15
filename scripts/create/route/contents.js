export const index = `<script>
  // imports
  import { onDestroy, onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  // import { goto } from '$app/navigation';
  import { Route } from '$components'
  // import { socket } from '$stores';

  // utilities

  // handlers

  // props (internal)

  // props (external)

  // props (dynamic)

  // lifecycle
  const lifecycle = {
    destroy : async () => {},
    mount : async () => {},
  }
  onDestroy(async() => await lifecycle.destroy());
  onMount(async() => await lifecycle.mount());
</script>

<Route>
</Route>

<slot/>`