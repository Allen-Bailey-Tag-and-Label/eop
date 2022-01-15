<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import { getEvents } from '$actions';
  import { navOpen } from '$stores';

  // utilities

  // handlers

  // props (internal)
  const defaultClasses = 'px-[1.5rem] py-[.5rem] transition duration-200 hover:text-primary-500';
  const events = getEvents();

  // props (external)
  export let clickHandler = () => $navOpen = !$navOpen;
  export let href = ''

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
  on:click={clickHandler}
  use:events
>
  <slot/>
</a>