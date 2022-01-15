<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  // import { goto } from '$app/navigation';
  import { Route } from '$components'
  // import { socket } from '$stores';

  // utilities

  // handlers

  // props (internal)
  let h = 0;

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

<Route
  class="bg-red-900 items-stretch flex flex-col items-stretch"
>
  <div bind:clientHeight={h} class='bg-green-900 space-y-[1rem] overflow-hidden h-[100%] flex-grow'>
    <div>{h}</div>
  </div>
</Route>

<slot/>