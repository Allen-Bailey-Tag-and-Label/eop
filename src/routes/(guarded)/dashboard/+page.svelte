<script>
  import { TitleBar } from '$components';

  // utilities

  // handlers

  // props (internal)

  // props (external)
  export let data;
  export let errors;

  // props (dynamic)
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar showBackButton={false}
    ><svelte:fragment slot="title">Dashboard</svelte:fragment></TitleBar
  >
  <div class="flex flex-col overflow-y-auto  p-[2rem]" />
</div>
