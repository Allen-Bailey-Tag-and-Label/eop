<script>
  // components
  import Button from './Button.svelte';

  // props ( external )
  export let href = '';
  export let theme = 'default';
  export let type = 'link';
</script>

<Button on:click padding="p-[6px]" {href} {theme} {type}><slot/></Button>