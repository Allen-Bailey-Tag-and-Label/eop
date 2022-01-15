<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import { navOpen } from '$stores';

  // utilities
  const toggleNav = () => $navOpen = !$navOpen

  // handlers

  // props (internal)
  const defaultClasses = 'flex fixed top-0 left-0 bg-black/[.95] cursor-pointer transition duration-200 w-screen h-screen';

  // props (external)

  // props (dynamic)
  $: classes = twMerge(defaultClasses, $navOpen ? 'opacity-[1] pointer-events-auto' : 'opacity-[0] pointer-events-none', $$props.class);

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

<div 
  class={classes}
  on:click={toggleNav}
/>
<slot/>