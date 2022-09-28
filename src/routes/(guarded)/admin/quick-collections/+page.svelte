<script>
  import { page } from '$app/stores';
  import {
    Button,
    DBButtonCreate,
    DBButtonFilter,
    DBButtonRemove,
    DBTable,
    Fieldset,
    Icon,
    Input,
    Modal,
    Select,
    TitleBar
  } from '$components';
  import { X } from '$icons';
  import { clientConnection as socketio } from '$lib/socketio';
  import { collections, routeStates, theme } from '$stores';

  // utilities

  // handlers
  const addFieldHandler = () =>
    (collectionColumns = [...collectionColumns, { name: '', type: 'string' }]);
  const updateColumns = async () => {
    const sanitizedColumns = [...collectionColumns].filter(
      ({ name, type }) => name !== '' && type !== ''
    );

    const formData = new FormData();
    formData.append('collection', collection);
    formData.append('query', JSON.stringify({ _id }));
    if (sanitizedColumns.length > 0) {
      formData.append('update', JSON.stringify({ $set: { columns: sanitizedColumns } }));
    }
    if (sanitizedColumns.length == 0) {
      formData.append('update', JSON.stringify({ $unset: { columns: '' } }));
    }
    const response = await fetch('/api/db?/update', {
      body: formData,
      method: 'POST'
    });
    const {
      data: { doc }
    } = await response.json();
    socketio.emit('db.update.doc', { collection, doc });
  };

  // props (internal)
  let _id;
  const collection = 'quick-collections';
  let columns = [
    { innerHTML: 'Name', key: 'name' },
    {
      clickHandler: ({ row }) => {
        _id = row._id;
        collectionColumns =
          $collections['quick-collections'].find((doc) => doc._id === row._id)?.columns || [];
        show = true;
      },
      innerHTML: 'Columns',
      key: 'columns',
      type: 'button'
    }
  ];
  let collectionColumns = [];
  let show = false;
  let toggleModal;
  const typeOptions = [
    { label: 'Button', value: 'button' },
    { label: 'Checkbox', value: 'checkbox' },
    { label: 'Date', value: 'date' },
    { label: 'Select', value: 'select' },
    { label: 'String', value: 'string' }
  ];

  if ($routeStates?.[$page.url.pathname] === undefined) {
    $routeStates[$page.url.pathname] = {
      filters: [],
      rows: [],
      sort: {
        direction: 1,
        key: 'name'
      }
    };
  }

  $: if ($collections['quick-collections']) {
    $routeStates[$page.url.pathname].rows = $collections['quick-collections'];
  }
  $: if (collectionColumns && _id !== undefined) {
    updateColumns();
  }
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">Admin - Quick Collections</svelte:fragment>
    <svelte:fragment slot="right">
      <DBButtonRemove bind:rows={$routeStates[$page.url.pathname].rows} {collection} />
      <DBButtonFilter bind:filters={$routeStates[$page.url.pathname].filters} {columns} />
      <DBButtonCreate {collection} {columns} />
    </svelte:fragment>
  </TitleBar>
  <DBTable
    bind:columns
    bind:rows={$routeStates[$page.url.pathname].rows}
    bind:sort={$routeStates[$page.url.pathname].sort}
    {collection}
    filters={$routeStates[$page.url.pathname].filters}
  />
</div>

<Modal bind:show bind:toggleModal>
  <div class="flex flex-col space-y-[1rem]">
    <div class="grid grid-cols-[auto_auto_auto] gap-x-[.5rem] gap-y-[1rem] items-end">
      {#each collectionColumns as { name, type }, i}
        <Fieldset legend="Column">
          <Input bind:value={name} />
        </Fieldset>
        <Fieldset legend="Type">
          <Select options={typeOptions} bind:value={type} />
        </Fieldset>
        <Button
          class="{$theme.buttonIcon} bg-red-500 hover:bg-red-600 focus:bg-red-600 focus:ring-red-500/[.3]"
          on:click={() => {
            collectionColumns = [
              ...collectionColumns.slice(0, i),
              ...collectionColumns.slice(i + 1)
            ];
          }}
        >
          <Icon src={X} />
        </Button>
      {/each}
    </div>
    <div class="flex space-x-[1rem] justify-end">
      <Button class="{$theme.buttonSecondary} " on:click={toggleModal} type="button">Cancel</Button>
      <Button on:click={addFieldHandler} type="button">Add Field</Button>
    </div>
  </div>
</Modal>
