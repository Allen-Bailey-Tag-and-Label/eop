<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import { getEvents } from '$actions';

  // utilities

  // handlers
  const inputHandler = e => {
    value = type.match(/^(number|range)$/)
      ? +e.target.value
      : e.target.value;
  }

  // props (internal)
  const defaultClasses = 'peer appearance-none bg-transparent flex-grow font-medium outline-none focus:outline-none px-[1.375rem] py-[.6875rem] rounded ring ring-white/[0] focus:ring-white/[.1] ring-offset-1 ring-offset-white/[.1] hover:ring-offset-white/[.2] transition duration-200 whitespce-nowrap';
  const events = getEvents();

  // props (external)
  export let readonly = false;
  export let type = 'text';
  export let value = '';

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

<input
  class={classes}
  on:input={inputHandler}
  {readonly}
  type={type}
  use:events
  {value}
  />
<slot/>