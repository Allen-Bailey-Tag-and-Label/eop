<script lang="ts">
  // imports
  import { current_component } from 'svelte/internal';
  import { Nav } from 'sveltewind/components';
  import { twMerge } from 'tailwind-merge';
  import { getEvents } from '$actions';
  import { NavGroup, NavItem } from '$components';
  import { nav } from '$stores';

  // props (external)
  export let style: string | undefined = undefined;
  export let use: any[] = [];

  // props (internal)
  const events = getEvents(current_component);

  // props (dynamic)
  $: classes = twMerge(
    $nav.isOpen ? 'translate-x-0' : 'translate-x-full lg:-translate-x-full',
    $$props.class
  );
</script>

<Nav class={classes} {style} use={[events, ...use]}>
  <slot>
    {#each [...$nav.groups.keys()].sort((a, b) => a.localeCompare(b)) as title}
      <NavGroup routes={$nav.groups.get(title)} {title} />
    {/each}
    <div class="flex flex-col flex-grow justify-end">
      <NavItem href="/sign-out">Sign Out</NavItem>
    </div>
  </slot>
</Nav>
