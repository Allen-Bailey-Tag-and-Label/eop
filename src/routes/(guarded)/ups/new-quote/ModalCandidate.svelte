<script>
  import { Button, H6, Icon, Modal, P } from '$components';
  import { X } from '$icons';

  // handlers
  const chooseCandidate = (AddressKeyFormat) => {
    updateShipToAddress(AddressKeyFormat);
    modal.candidate.show = false;
    submitted = false;
    submitHandler();
  };

  // props (external)
  export let modal;
</script>

<Modal bind:show={modal.candidate.show} class="flex flex-col space-y-[1rem]">
  <H6>Candidates</H6>
  <div class="flex flex-col space-y-[.5rem]">
    {#each modal.candidate.candidates as { AddressKeyFormat }}
      <div class="flex items-center space-x-[1rem]">
        <P class="flex-grow">{AddressKeyFormat.AddressLine}, {AddressKeyFormat.Region}</P>
        <Button on:click={() => chooseCandidate(AddressKeyFormat)}>Select</Button>
      </div>
    {/each}
  </div>
  <Button class="self-end" on:click={() => (modal.candidate.show = !modal.candidate.show)}
    >Close</Button
  >
</Modal>
