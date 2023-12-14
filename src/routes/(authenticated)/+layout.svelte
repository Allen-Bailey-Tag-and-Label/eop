<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { Header, Modal, ProgressIndicator } from '$components';
  import { nav } from '$stores';
  import { onMount } from 'svelte';

  // props (external)
  export let data;

  // props (internal)
  let isNavigating = true;

  nav.setGroups(data.navGroups);

  afterNavigate(() => {
    isNavigating = false;
    nav.close();
  });
  beforeNavigate(() => (isNavigating = true));
  onMount(() => (isNavigating = false));
</script>

<div
  class="min-h-[100dvh] max-h-[100dvh] flex flex-col lg:flex-row pwa:min-h-[100vh] pwa:max-h-[100vh]"
>
  <Header />
  <main
    class="flex flex-col flex-grow overflow-auto lg:order-2 p-[1.5rem] pt-[calc(1.5rem_+_env(safe-area-inset-top))]"
  >
    <slot />
  </main>
</div>

<Modal class="min-w-[0px] text-violet-500" isOpen={isNavigating}>
  <ProgressIndicator />
</Modal>
