<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import { getEvents } from '$actions';

  // utilities

  // handlers

  // props (internal)
  const defaultClasses = 'font-bold text-[2.5rem] leading-[2.5rem]';
  const events = getEvents();

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

<h1
  class={classes}
  use:events
>
  <slot/>
</h1>