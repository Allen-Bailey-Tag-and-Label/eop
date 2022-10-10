<script>
  import { twMerge } from 'tailwind-merge';
  import { Icon, Label } from '$components';
  import { Check } from '$icons';
  import { theme } from '$stores';

  // props (external)
  export let group;
  export let value;

  // props (dynamic)
  $: classes = twMerge($theme.radio, group !== value ? '' : $theme.radioCurrent, $$props.class);
</script>

<Label class="relative flex">
  <slot name="input">
    <input bind:group class="peer absolute top-0 left-0 opacity-0 w-0" type="radio" {value} />
  </slot>
  <slot name="handle">
    <div class={classes} />
  </slot>
  <slot />
</Label>
