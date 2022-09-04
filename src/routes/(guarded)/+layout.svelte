<script>
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { Header, Main } from '$components';

  // utilities

  // handlers

  // props (internal)

  // props (external)
  export let data;
  export let errors;

  // props (dynamic)
  $: if (browser && data?.status === 401) goto('/signin');
  $: routes = data.user?.routes || [];
</script>

<Main>
  <div class="flex flex-col flex-grow overflow-hidden">
    <slot />
  </div>
  <Header {routes} />
</Main>
