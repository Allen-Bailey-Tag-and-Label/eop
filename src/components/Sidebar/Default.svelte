<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import { NavToggle } from '$components';
  import { navOpen } from '$stores';

  // utilities

  // handlers

  // props (internal)
  const defaultClasses = 'flex justify-end order-2 border-white/[.1] border-t lg:order-1 lg:border-t-0 lg:border-r';

  // props (external)

  // props (dynamic)
  $: classes = twMerge(defaultClasses, $navOpen ? 'z-[2] lg:border-white/[0]' : '', $$props.class);

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
>
  <NavToggle
    bind:show={$navOpen}
  />
  <slot/>
</div>