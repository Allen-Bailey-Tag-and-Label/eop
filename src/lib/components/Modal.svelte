<script>
  import { Overlay } from '$components';
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
    class={!show ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}
    on:click={toggleModal}
  />
</slot>
<div
  class="{$theme.modal} {!show
    ? 'opacity-0 pointer-events-none'
    : 'opacity-100 pointer-events-auto'}"
>
  <slot />
</div>
