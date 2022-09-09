<script>
  import { onMount } from 'svelte';
  import { MongoSocketRegistration, MongoTable, TitleBar } from '$components';
  import store from './store';

  // utilities

  // handlers

  // props (internal)
  let columns = [
    { innerHTML: 'First', key: 'firstName' },
    { innerHTML: 'Last', key: 'lastName' },
    { innerHTML: 'Email', key: 'email' },
    { innerHTML: 'Extension', key: 'extension', mask: 'extension' }
  ];
  let rows = [];

  // props (external)
  export let data;
  export let errors;

  // lifecycle
  onMount(
    () =>
      ($store.users = data.users.sort((a, b) => {
        if (a?.lastName < b?.lastName) return -1;
        if (a?.lastName > b?.lastName) return 1;
        return 0;
      }))
  );
</script>

<MongoSocketRegistration bind:store={$store} />

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">Users - Directory</svelte:fragment>
  </TitleBar>
  <MongoTable bind:columns bind:rows={$store.users} editable={false} />
</div>
