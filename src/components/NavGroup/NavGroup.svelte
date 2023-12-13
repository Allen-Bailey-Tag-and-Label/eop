<script lang="ts">
  // imports
  import { current_component } from 'svelte/internal';
  import { twMerge } from 'tailwind-merge';
  import { getEvents } from '$actions';
  import { NavGroupTitle, NavItem } from '$components';
  import { theme } from '$stores';

  // props (external)
  export let routes = new Map();
  export let style: string | undefined = undefined;
  export let title = '';
  export let use: any[] = [];

  // props (internal)
  const events = getEvents(current_component);

  // props (dynamic)
  $: classes = twMerge('', $theme.navGroup, $$props.class);
</script>

<div class={classes} {style} use={[events, ...use]}>
  <slot>
    {#if title !== ''}
      <NavGroupTitle>{title}</NavGroupTitle>
    {/if}
    {#each [...routes.values()].sort((a, b) => a.label.localeCompare(b.label)) as { label, href }}
      <NavItem {href}>
        {label}
      </NavItem>
    {/each}
  </slot>
</div>
