<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import { Checkbox, Th } from '$components';
	import { camelCaseToSentenceCase, tableTypeClasses } from '$lib/utils';
  // import { getEvents } from '$actions';

  // utilities

  // handlers

  // props (internal)
  const defaultClasses = '';
  // const events = getEvents();

  // props (external)
  export let columns = [];
  export let sort = {
    direction: 1,
    key: ''
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

<thead
  class={classes}
>
  <slot>
    {#each columns as { classes = '', key, title = null, type = 'string', ...column }}
      <Th
        bind:sort
        class={twMerge(tableTypeClasses[type], classes)}
        {key}
      >
        {#if type === 'checkbox'}
          <Checkbox
            bind:checked={column.checked}
            bind:indeterminate={column.indeterminate}
            on:change={column.changeHandler}
          />
        {:else if type === 'string'}
          {#if title !== null}
            {title}
          {:else}
            {camelCaseToSentenceCase(key)}
          {/if}
        {/if}
      </Th>
    {/each}
  </slot>
</thead>