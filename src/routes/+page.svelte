<script>
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  // props (dynamic)
  $: if (browser) goto('/signin');
</script>
