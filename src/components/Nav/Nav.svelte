<script lang="ts">
  // imports
  import { current_component } from 'svelte/internal';
  import { Nav } from 'sveltewind/components';
  import { twMerge } from 'tailwind-merge';
  import { getEvents } from '$actions';

  // props (external)
  export let close = () => (isOpen = false);
  export let isOpen = false;
  export let open = () => (isOpen = true);
  export let toggle = () => (isOpen = !isOpen);
  export let style: string | undefined = undefined;
  export let use: any[] = [];

  // props (internal)
  const events = getEvents(current_component);

  // props (dynamic)
  $: classes = twMerge(
    '',
    isOpen ? 'translate-x-0' : 'translate-x-full lg:-translate-x-full',
    $$props.class
  );
</script>

<Nav class={classes} {style} use={[events, ...use]}>
  <slot>
    {#each [...Array(100)] as _, i}
      <div>{i}</div>
    {/each}
  </slot>
</Nav>
