<script>
  import { MongoTable, TitleBar } from '$components';
  import { collections } from '$stores';

  // utilities

  // handlers

  // props (internal)
  let columns = [
    { innerHTML: 'First', key: 'firstName' },
    { innerHTML: 'Last', key: 'lastName' },
    { innerHTML: 'Email', key: 'email' },
    { innerHTML: 'Extension', key: 'extension', mask: 'extension' }
  ];

  // props (external)
  export let data;
  export let errors;
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">Users - Directory</svelte:fragment>
  </TitleBar>
  <MongoTable bind:columns bind:rows={$collections.users} editable={false} />
</div>
