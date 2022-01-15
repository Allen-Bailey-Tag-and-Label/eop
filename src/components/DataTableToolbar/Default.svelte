<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import { DataTableToolbarCreate, DataTableToolbarExport, DataTableToolbarRemove } from '$components';

  // utilities

  // handlers

  // props (internal)
  const defaultClasses = 'flex space-x-[.25rem] items-center';

  // props (external)
  export let columns = [];
  export let on = {};
  export let items = [
    { component: DataTableToolbarRemove, props: { on } },
    { component: DataTableToolbarExport, props: { on } },
    { component: DataTableToolbarCreate, props: { on } },
  ]
  export let rows = [];

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

<div 
  class={classes}
>
  <slot>
    {#each items as {component, props}}
      <svelte:component 
        bind:columns
        bind:rows
        this={component} 
        {...props}
      />
    {/each}
  </slot>
</div>