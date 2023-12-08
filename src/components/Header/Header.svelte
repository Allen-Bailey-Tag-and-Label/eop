<script lang="ts">
  // imports
  import { current_component } from 'svelte/internal';
  import { Header } from 'sveltewind/components';
  import { twMerge } from 'tailwind-merge';
  import { getEvents } from '$actions';
  import { Overlay, Nav, NavToggleButton } from '$components';

  // props (external)
  export let nav = {};
  export let style: string | undefined = undefined;
  export let use: any[] = [];

  // props (internal)
  const events = getEvents(current_component);

  // props (dynamic)
  $: classes = twMerge('', $$props.class);
</script>

<Header class={classes} {style} use={[events, ...use]}>
  <slot>
    <Overlay
      class={nav?.isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}
      on:click={nav.toggle}
    />
    <Nav
      bind:close={nav.close}
      bind:isOpen={nav.isOpen}
      bind:open={nav.open}
      bind:toggle={nav.toggle}
    />
    <NavToggleButton
      bind:close={nav.close}
      bind:isOpen={nav.isOpen}
      bind:open={nav.open}
      bind:toggle={nav.toggle}
    />
  </slot>
</Header>
