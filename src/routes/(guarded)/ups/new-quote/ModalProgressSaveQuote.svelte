<script>
  import { Modal, P } from '$components';

  // props (external)
  export let modal;
</script>

<Modal bind:show={modal.progress.saveQuote.show} class="flex flex-col space-y-[1rem]">
  <P class="overflow-auto">Saving quote...</P>
</Modal>
