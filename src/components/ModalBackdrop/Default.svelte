<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';

  // utilities

  // handlers
  const clickHandler = () => show = !show;

  // props (internal)
  const defaultClasses = 'bg-black/[.95] absolute top-0 left-0 w-full h-full';

  // props (external)
  export let show = false;

  // props (dynamic)
  $: classes = twMerge(defaultClasses, show ? 'pointer-events-auto' : 'pointer-events-none', $$props.class);

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
  on:click={clickHandler}
/>
<slot/>