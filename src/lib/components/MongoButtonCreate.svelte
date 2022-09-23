<script>
  import { applyAction, enhance } from '$app/forms';
  import { Button, Fieldset, Form, Icon, Input, Modal } from '$components';
  import { Plus } from '$icons';
  import { postFetch } from '$lib/helpers';
  import { clientConnection as socketio } from '$lib/socketio';
  import { theme } from '$stores';
  import { stringify } from 'postcss';

  // utilities

  // handlers
  const submitHandler = async (e) => {
    e.preventDefault();

    const response = await postFetch({ body: { collection, insert }, url: '/api/db/?create' });
    let { doc } = await response.json();
    socketio.emit('db.create.doc', { collection, doc });
    toggleModal();
  };
  const toggleModal = () => (show = !show);

  // props (internal)
  let insert = {};
  let show = false;

  // props (external)
  export let collection = '';
  export let columns = [];

  // props (dynamic)
  $: if (Object.keys(insert).length === 0 && columns.length > 0)
    insert = [...columns].reduce((obj, column) => {
      if (column?.key !== undefined && column?.key !== '') obj[column.key] = '';
      return obj;
    }, {});
</script>

<Button class={$theme.buttonIcon} on:click={toggleModal}>
  <Icon src={Plus} />
</Button>

<div>
  <Modal bind:show>
    <Form
      action="/api/db?/create"
      use={[
        [
          enhance,
          () => {
            return async ({ result }) => {
              let { doc } = result.data;
              socketio.emit('db.create.doc', { collection, doc });
              toggleModal();
              applyAction(result);
            };
          }
        ]
      ]}
    >
      <input type="hidden" name="collection" value={collection} />
      <input type="hidden" name="insert" value={JSON.stringify(insert)} />
      {#each columns as column}
        {#if column.type === 'hidden'}
          <input type="hidden" name={column.name} value={JSON.stringify(column.value)} />
        {:else}
          <Fieldset legend={column?.innerHTML}>
            <Input bind:value={insert[column.key]} />
          </Fieldset>
        {/if}
      {/each}
      <div class="grid grid-cols-2 gap-[1rem]">
        <Button class="{$theme.buttonSecondary} " on:click={toggleModal} type="button"
          >Cancel</Button
        >
        <Button type="submit">Add</Button>
      </div>
    </Form>
  </Modal>
</div>
