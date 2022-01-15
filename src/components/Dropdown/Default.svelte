<script>
  // imports
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { twMerge } from 'tailwind-merge';

  // utilities

  // handlers

  // props (internal)
  const defaultClasses = 'absolute right-0 top-[1.75rem] p-[1rem] bg-gray-900 z-[1] rounded ring ring-1 ring-white/[.1]';

  // props (external)
  export let open = false;

  // props (dynamic)
  $: classes = twMerge(defaultClasses, '', $$props.class);

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

{#if open}
  <div
    class={classes}
    transition:slide
  >
    <slot/>
  </div>
{/if}