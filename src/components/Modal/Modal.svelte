<script lang="ts">
  // imports
  import { current_component } from 'svelte/internal';
  import { twMerge } from 'tailwind-merge';
  import { getEvents } from '$actions';
  import { Card, Overlay, Portal } from '$components';
  import { theme } from '$stores';

  // props (internal)
  const events = getEvents(current_component);

  // props (external)
  export let close = () => (isOpen = false);
  export let isOpen = false;
  export let open = () => (isOpen = true);
  export let style: string | undefined = undefined;
  export let toggle = () => (isOpen = !isOpen);
  export let use: any[] = [];
</script>

<Portal>
  <Overlay
    class={twMerge(isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')}
    on:click={close}
  />
  <div class={twMerge($theme.modal, !isOpen ? $theme.modalIsClosed : $theme.modalIsOpen)}>
    <Card class={twMerge('overflow-auto', $$props.class)} {style} use={[events, ...use]}>
      <slot />
    </Card>
  </div>
</Portal>
