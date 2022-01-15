<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  // import { getEvents } from '$actions';

  // utilities

  // handlers

  // props (internal)
  const defaultClasses = 'p-[.5rem] whitespace-nowrap border-b border-white/[.05]';
  // const events = getEvents();

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

<td
  class={classes}
>
  <slot/>
</td>