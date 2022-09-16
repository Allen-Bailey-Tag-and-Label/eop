<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { Header, Main } from '$components';
  import { collections } from '$stores';

  // utilities

  // handlers

  // props (internal)

  // props (external)
  export let data;
  export let errors;

  // props (dynamic)
  $: if (browser && data?.status === 401) goto('/signin');
  $: routes = data.user?.routes || [];

  // lifecycle
  onMount(() => ($collections = data?.collections || {}));
</script>

<Main>
  <div class="flex flex-col flex-grow overflow-hidden">
    <slot />
  </div>
  <Header {routes} />
</Main>
