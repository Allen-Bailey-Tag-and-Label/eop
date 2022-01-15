<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';

  // utilities

  // handlers

  // props (internal)
  const defaultClasses = 'flex flex-col space-y-[.5rem]';

  // props (external)
  export let label = '';
  export let response = '';

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

<div class={classes}>
  <div>{label}</div>
  <slot/>
  <div>{response}</div>
</div>