<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';

  // utilities

  // handlers

  // props (internal)
  const defaultClasses = 'px-[1.5rem] py-[.5rem] uppercase text-white font-bold';

  // props (external)

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

<div
  class={classes}
>
  <slot/>
</div>