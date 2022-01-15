<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import { Tbody, Thead } from '$components';

  // utilities

  // handlers

  // props (internal)
  const defaultClasses = 'w-full';

  // props (external)
  export let columns = [];
  export let rows = [];
  export let sort = {
    direction: 1,
    key: '',
  }

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

<div class="flex flex-grow overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary-500 scrollbar-thumb-rounded pr-[.5rem]">
  <table
    class={classes}
  >
    <slot name="thead">
      <Thead
        bind:columns
        bind:sort
      />
    </slot>
    <slot name="tbody">
      <Tbody
        bind:columns
        bind:rows
      />
    </slot>
  </table>
</div>
<slot/>