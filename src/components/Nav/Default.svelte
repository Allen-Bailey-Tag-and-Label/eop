<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import { Backdrop, NavInner, Offscreen } from '$components'
  import { navOpen } from '$stores';

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

<Offscreen
  bind:show={$navOpen}
  class='pb-[3.5rem] lg:pb-0 lg:pl-[3.5rem] lg:border-r lg:border-white/[.1]'
  direction={[
    'top-0 left-0 translate-x-0',
    'top-0 left-0 translate-x-[100%] lg:translate-x-[-100%]'
  ]}
  showCloseButton={false}
>
  <NavInner />
</Offscreen>
<slot/>