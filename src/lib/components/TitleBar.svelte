<script>
  import { Button, H6, Icon } from '$components';
  import { ChevronLeft } from '$icons';
  import { theme } from '$stores';

  // utilities

  // handlers
  const backButtonClickHandler = () => history.back();

  // props (internal)

  // props (external)
  export let showBackButton = false;

  // props (dynamic)
</script>

<div class={$theme.titleBar}>
  <slot>
    <slot name="left">
      <div class="flex space-x-[.5rem] items-center">
        {#if showBackButton}
          <Button
            class="{$theme.buttonIcon} {$theme.buttonTransparent}"
            on:click={backButtonClickHandler}
          >
            <Icon src={ChevronLeft} />
          </Button>
        {/if}
        <H6 class="text-[1rem] leading-[1em]"><slot name="title" /></H6>
      </div>
    </slot>
    <div class="flex items-center">
      <slot name="right" />
    </div>
  </slot>
</div>
