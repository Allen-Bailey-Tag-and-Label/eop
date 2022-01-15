<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import { Checkbox, Td, Tr } from '$components'
  import { tableTypeClasses } from '$lib/utils';
  // import { getEvents } from '$actions';

  // utilities

  // handlers

  // props (internal)
  const defaultClasses = '';
  // const events = getEvents();

  // props (external)
  export let columns = [];
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

<tbody
  class={classes}
>
  <slot>
    {#each rows as row}
      <Tr>
        {#each columns as { classes = '', key, type = 'string' }}
          <Td class={twMerge(tableTypeClasses[type], classes)}>
            {#if key in row}
              {#if type === 'checkbox'}
                {#if ('changeHandler' in row[key]) && ('checked' in row[key]) && ('indeterminate' in row[key])}
                  <Checkbox
                    bind:checked={row[key].checked}
                    bind:indeterminate={row[key].indeterminate}
                    on:change={row[key].changeHandler}
                  />
                {/if}
              {:else if type === 'string'}
                {row?.[key] || ''}
              {/if}
            {/if}
          </Td>
        {/each}
      </Tr>
    {/each}
  </slot>
</tbody>