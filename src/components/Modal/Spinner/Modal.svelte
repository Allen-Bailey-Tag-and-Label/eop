<script>
  // components
  import Card from '$components/Card.svelte';
  import Modal from '$components/Modal/Modal.svelte';
  import Spinner from '$components/Spinner.svelte';

  // stores
  import show from './store';
</script>

<Modal closeable={false} bind:show={$show}>
  <Card class="transition duration-200 {$show?'opacity-100':'opacity-0'}">
    <Spinner />
  </Card>
</Modal>