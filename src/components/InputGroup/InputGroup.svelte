<script lang="ts">
  // imports
  import { current_component } from 'svelte/internal';
  import { twMerge } from 'tailwind-merge';
  import { getEvents, use as useAction } from '$actions';
  import { theme } from '$stores';

  // props (external)
  export let style: string | undefined = undefined;
  export let use: any[] = [];

  // props (internal)
  const events = getEvents(current_component);

  // props (dynamic)
  $: classes = twMerge('', $theme.inputGroup, $$props.class);
</script>

<div class={classes} {style} use:useAction={[events, ...use]}>
  <slot />
</div>
