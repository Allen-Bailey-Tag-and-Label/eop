<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  // import { getEvents } from '$actions';
  import { Backdrop, Route } from '$components'

  // utilities

  // handlers

  // props (internal)
  const defaultClasses = 'min-w-screen w-full min-h-screen h-screen fixed overflow-auto top-0 left-0 flex flex-col transition duration-200 items-center justify-center z-[1] pointer-events-none';

  // props (external)
  export let show = false;

  // props (dynamic)
  $: classes = twMerge(defaultClasses, show ? 'opacity-[1]' : 'opacity-[0]', $$props.class);

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
<div 
  class={classes} 
/>
  <Backdrop 
    bind:show
  />
  <Route class='flex-grow-0 pointer-events-auto'>
    <slot/>
  </Route>
</div>