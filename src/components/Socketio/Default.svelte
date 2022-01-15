<script>
  // imports
  import { io } from 'socket.io-client';
  import { onMount } from 'svelte';
  import { socket } from '$stores';

  // utilities

  // handlers

  // props (internal)

  // props (external)

  // props (dynamic)

  // lifecycle
  const lifecycle = {
    destroy : () => {},
    mount : async () => {
      $socket = io();
    },
  }
  onMount(async() => {
    await lifecycle.mount();
    return () => {
      lifecycle.destroy();
    }
  })
</script>

<slot/>