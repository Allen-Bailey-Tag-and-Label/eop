<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge'

  // utilities

  // handlers

  // props (internal)

  // props (external)
  export let type = 'fullscreen'

  // props (dynamic)
  $: classes = type === 'fullscreen' ? twMerge('flex flex-grow relative items-center justify-center p-[1rem]', $$props.class) : '';

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
  <slot/>
</div>