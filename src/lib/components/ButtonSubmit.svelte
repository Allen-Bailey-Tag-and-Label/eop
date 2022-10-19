<script>
  import { Button, ProgressIndicator } from '$components';

  // props (external)
  export let submitted = false;
</script>

<Button class={$$props.class} type="submit">
  {#if !submitted}
    <slot />
  {:else}
    <ProgressIndicator class="w-[1.5rem] h-[1.5rem]" />
  {/if}
</Button>
