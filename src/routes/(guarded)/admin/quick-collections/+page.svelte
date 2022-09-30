<script>
  import { applyAction, enhance } from '$app/forms';
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
    (collectionColumns = [...collectionColumns, { innerHTML: '', key: '', type: 'string' }]);
  const updateColumns = async () => {
    const sanitizedColumns = [...collectionColumns].filter(
      ({ innerHTML, key, type }) => innerHTML !== '' && key !== '' && type !== ''
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
  let collection = 'quick-collections';
  let collectionColumns = [];
  let columns = [
    { innerHTML: 'Name', key: 'name' },
    { innerHTML: 'HREF', key: 'href' },
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
      pagination: {
        length: undefined,
        page: undefined
      },
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
      <DBButtonCreate
        {collection}
        {columns}
        use={[
          [
            enhance,
            () => {
              return async ({ result }) => {
                console.log(result);
                let { doc } = result.data;
                socketio.emit('db.create.doc', { collection, doc });

                const formData = new FormData();
                formData.append('collection', 'collections');
                formData.append('insert', JSON.stringify({ name: doc.href }));
                const response = await fetch('/api/db?/create', {
                  body: formData,
                  method: 'POST'
                });
                const { data } = await response.json();
                socketio.emit('db.update.doc', { collection: 'collections', doc: data.doc });

                applyAction(result);
              };
            }
          ]
        ]}
      />
    </svelte:fragment>
  </TitleBar>
  <DBTable
    bind:columns
    bind:pagination={$routeStates[$page.url.pathname].pagination}
    bind:rows={$routeStates[$page.url.pathname].rows}
    bind:sort={$routeStates[$page.url.pathname].sort}
    {collection}
    filters={$routeStates[$page.url.pathname].filters}
  />
</div>

<Modal bind:show bind:toggleModal>
  <div class="flex flex-col space-y-[1rem]">
    <div class="grid grid-cols-[auto_auto_auto_auto] gap-x-[.5rem] gap-y-[1rem] items-end">
      {#each collectionColumns as { innerHTML, key, type }, i}
        <Fieldset legend="Key">
          <Input
            bind:value={key}
            on:keyup={() => {
              innerHTML = key
                .split('-')
                .map((word) => (word.length === 0 ? '' : word[0].toUpperCase() + word.slice(1)))
                .join(' ');
            }}
          />
        </Fieldset>
        <Fieldset legend="InnerHTML">
          <Input bind:value={innerHTML} />
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
