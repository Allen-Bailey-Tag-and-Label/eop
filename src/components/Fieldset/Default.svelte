<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';

  // utilities

  // handlers

  // props (internal)
  const defaultClasses = 'flex flex-col space-y-[1rem]';

  // props (external)
  export let disabled = false;

  // props (dynamic)
  $: classes = twMerge(defaultClasses, $$props.class);

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

<fieldset
  class={classes}
  disabled={disabled}
>
  <slot/>
</fieldset>