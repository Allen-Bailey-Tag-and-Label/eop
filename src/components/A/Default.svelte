<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import { getEvents } from '$actions';

  // utilities

  // handlers

  // props (internal)
  const defaultClasses = 'underline transition text-primary-500 font-bold duration-200 decoration-primary-500/0 hover:decoration-2 hover:decoration-primary-500 underline-offset-4';
  const events = getEvents();

  // props (external)
  export let href= '';

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

<a
  class={classes}
  {href}
  use:events
>
  <slot/>
</a>