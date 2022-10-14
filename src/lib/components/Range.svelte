<script>
  import { twMerge } from 'tailwind-merge';
  import { theme } from '$stores';

  // props (external)
  export let max;
  export let min;
  export let value;

  // props (dynamic)
  $: classes = twMerge($theme.range, $$props.class);
</script>

<div class="relative">
  <input bind:value class={classes} {max} {min} type="range" />
  <div
    class="absolute top-1/2 left-0 -translate-y-1/2 rounded-full h-[.5rem] bg-primary-500/[.5]"
    style="width: {((value - min) / (max - min)) * 100}%"
  />
</div>
