<script>
  import { Card, Overlay } from '$components';
  import { theme } from '$stores';

  // utilities

  // handlers

  // props (internal)

  // props (external)
  export let show = true;
  export let toggleModal = () => (show = !show);

  // props (dynamic)
</script>

<slot name="overlay">
  <Overlay
    class={!show
      ? 'opacity-0 pointer-events-none'
      : 'opacity-100 pointer-events-auto cursor-pointer'}
    on:click={toggleModal}
  />
</slot>
<Card
  class="{$theme.modal} {!show
    ? 'opacity-0 pointer-events-none translate-y-full'
    : 'opacity-100 pointer-events-auto translate-y-0'} {$$props.class}"
>
  <slot />
</Card>
