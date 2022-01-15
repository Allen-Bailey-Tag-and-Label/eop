<script>
  // imports
  import { onDestroy, onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  // import { getEvents } from '$actions';

  // utilities

  // handlers

  // props (internal)
  const defaultClasses = '';
  // const events = getEvents();

  // props (external)
  export let group = '';
  export let value = '';

  // props (dynamic)
  $: classes = twMerge(defaultClasses, '', $$props.class);

  // lifecycle
  const lifecycle = {
    destroy : async () => {},
    mount : async () => {},
  }
  onDestroy(async() => lifecycle.destroy());
  onMount(async() => await lifecycle.mount());
</script>

<label>
  <input 
    bind:group
    type="radio"
    {value}
  />
  <slot/>
</label>