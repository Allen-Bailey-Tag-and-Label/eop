<script>
  import { H5, TitleBar } from '$components';

  // utilities

  // handlers

  // props (internal)

  // props (external)
  export let data;

  // props (dynamic)
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">Dashboard</svelte:fragment>
  </TitleBar>
  <div class="flex flex-col overflow-y-auto p-[2rem]">
    <H5>Welcome {data?.user?.firstName} {data?.user?.lastName}</H5>
  </div>
</div>
