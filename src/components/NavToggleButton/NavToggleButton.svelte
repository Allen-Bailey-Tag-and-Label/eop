<script lang="ts">
  // imports
  import { current_component } from 'svelte/internal';
  import { twMerge } from 'tailwind-merge';
  import { getEvents } from '$actions';
  import { Button } from '$components';
  import { nav, theme } from '$stores';

  // props (external)
  export let style: string | undefined = undefined;
  export let use: any[] = [];

  // props (internal)
  const events = getEvents(current_component);
  const menuButtonClasses = [
    {
      true: 'rotate-[45deg]',
      false: 'mt-[-.1875rem]'
    },
    {
      true: 'rotate-[-45deg]',
      false: 'mt-[.1875rem]'
    }
  ];

  // props (dynamic)
  $: classes = twMerge(
    $theme.buttonIcon,
    $theme.buttonTransparent,
    $theme.navToggleButton,
    $$props.class
  );
</script>

<Button class={classes} on:click={nav.toggle} {style} use={[events, ...use]}>
  <slot>
    {#each menuButtonClasses as classes}
      <div
        class="absolute top-1/2 left-1/2 w-4 h-[2px] bg-current -translate-x-1/2 -translate-y-1/2 rounded-full transition duration-200 {$nav.isOpen
          ? classes.true
          : classes.false}"
      />
    {/each}
  </slot>
</Button>
