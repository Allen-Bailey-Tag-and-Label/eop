const defaults = `<script>
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

<slot/>`

const js = `export { default as default } from './Default.svelte';`

export { defaults as default, js };