<script lang="ts">
  // imports
  import { current_component } from 'svelte/internal';
  import { twMerge } from 'tailwind-merge';
  import { getEvents } from '$actions';
  import { page } from '$app/stores';
  import { A } from '$components';
  import { theme } from '$stores';

  // props (external)
  export let href = '';
  export let label = '';
  export let style: string | undefined = undefined;
  export let use: any[] = [];

  // props (internal)
  const events = getEvents(current_component);

  // props (dynamic)
  $: classes = twMerge(
    '',
    $theme.navItem,
    $page.url.pathname === href ? $theme.navItemCurrent : undefined,
    $$props.class
  );
</script>

<A class={classes} {href} {style} use={[events, ...use]}>
  <slot>
    {label}
  </slot>
</A>
