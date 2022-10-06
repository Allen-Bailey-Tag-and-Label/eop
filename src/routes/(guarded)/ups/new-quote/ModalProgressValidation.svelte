<script>
  import { Modal, P } from '$components';

  // props (external)
  export let modal;
</script>

<Modal bind:show={modal.progress.validation.show} class="flex flex-col space-y-[1rem]">
  <P class="overflow-auto">Validating Address...</P>
</Modal>
