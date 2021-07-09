<script>
  // components
  import Button from './Button.svelte';
  import Icon, {ChevronLeft} from 'svelte-hero-icons';

  // handler
  const clickHandler = e => {
    e.preventDefault();
    if ( window ) window.history.back()
  }
</script>

<Button on:click={clickHandler} padding="p-[11px]"><Icon src={ChevronLeft} class="w-[24px] h-[24px]"/></Button>