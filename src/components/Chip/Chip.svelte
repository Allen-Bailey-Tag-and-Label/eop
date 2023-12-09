<script lang="ts">
  // imports
  import { current_component } from 'svelte/internal';
  import { twMerge } from 'tailwind-merge';
  import { getEvents } from '$actions';
  import { theme } from '$stores';

  // props (external)
  export let style: string | undefined = undefined;
  export let use: any[] = [];

  // props (internal)
  const events = getEvents(current_component);

  // props (dynamic)
  $: classes = twMerge('', $theme.chip, $$props.class);
</script>

<div class={classes} {style} use={[events, ...use]}>
  <slot />
</div>
