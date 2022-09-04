<script>
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  // props (external)
  export let data = '';
  export let errors = '';

  $: if (browser) goto('/signin');
</script>
