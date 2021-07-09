<script>
  // components
  import Button from '$components/Button/Button.svelte';
  import Card from '$components/Card.svelte';
  import Container from '$components/Container.svelte';
  import Icon, { ThumbUp } from 'svelte-hero-icons';
  import Modal from '$components/Modal/Modal.svelte';

  // stores
  import store from './store';
</script>

<Modal show={$store.show}>
  <Container class="flex justify-center pointer-events-none">
    <Card class="max-w-[375px] transition duration-200 {$store.show?'opacity-100 pointer-events-auto':'opacity-0 pointer-events-none'}">
      <div class="flex flex-col items-center space-y-[32px]">
        <Icon src={ThumbUp} class="w-[80px] h-[80px] text-green-500" />
        <div>{$store.message}</div>
        <Button theme="success" on:click={()=>store.hide()}>Close</Button>
      </div>
    </Card>
  </Container>
</Modal>