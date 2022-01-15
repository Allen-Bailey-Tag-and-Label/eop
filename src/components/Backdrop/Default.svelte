<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';

  // utilities

  // handlers
  const clickHandler = () => show = !show;

  // props (internal)
  const defaultClasses = 'z-[1] flex fixed top-0 left-0 bg-black/[.95] cursor-pointer transition duration-200 w-screen h-screen';

  // props (external)
  export let show = false;

  // props (dynamic)
  $: classes = twMerge(defaultClasses, show ? 'opacity-[1] pointer-events-auto' : 'opacity-[0] pointer-events-none', $$props.class);

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