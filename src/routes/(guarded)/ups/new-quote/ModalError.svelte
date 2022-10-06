<script>
  import { Button, Card, H6, Icon, Modal, P } from '$components';
  import { X } from '$icons';

  // props (external)
  export let modal;
</script>

<Modal bind:show={modal.error.show} class="flex flex-col space-y-[1rem]">
  <H6>Error</H6>
  <P class="overflow-auto">{modal.error.body}</P>
  <Button
    class="self-end bg-red-500 hover:bg-red-600 focus:bg-red-600 focus:ring-red-500/30"
    on:click={() => (modal.error.show = !modal.error.show)}>Close</Button
  >
</Modal>
