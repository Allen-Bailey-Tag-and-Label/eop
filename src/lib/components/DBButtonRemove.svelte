<script>
  import { applyAction, enhance } from '$app/forms';
  import { Button, Form, H6, Icon, Modal, P } from '$components';
  import { Trash } from '$icons';
  import { clientConnection as socketio } from '$lib/socketio';
  import { theme } from '$stores';

  // utilities

  // handlers
  const clickHandler = () => {
    toggleModal();
  };
  const toggleModal = () => (show = !show);

  // props (internal)
  let show = false;

  // props (external)
  export let collection = '';
  export let rows = [];

  // props (dynamic)
  $: selectedRows = [...rows].filter((row) => row?._mongoTable?.selected);
  $: query = {
    $or: [...selectedRows].map(({ _id }) => {
      return { _id };
    })
  };
</script>

{#if selectedRows.length > 0}
  <Button
    class="{$theme.buttonIcon} ml-[.5rem] bg-red-500 hover:bg-red-600 focus:bg-red-600 focus:ring-red-500/[.3]"
    on:click={clickHandler}
  >
    <Icon src={Trash} />
  </Button>
{/if}

<div>
  <Modal bind:show>
    <Form
      action="/api/db?/remove"
      use={[
        [
          enhance,
          () => {
            return async ({ result }) => {
              [...selectedRows].map(({ _id }) => {
                socketio.emit('db.remove.doc', { collection, doc: { _id } });
              });
              toggleModal();
              applyAction(result);
            };
          }
        ]
      ]}
    >
      <input type="hidden" name="collection" value={collection} />
      <input type="hidden" name="query" value={JSON.stringify(query)} />
      <div class="flex flex-col space-y-[.5rem]">
        <H6 class="text-center"
          >Are you sure you want to delete {selectedRows.length} item{selectedRows.length === 1
            ? ''
            : 's'}?</H6
        >
        <P class="opacity-50 text-center">This cannot be undone</P>
      </div>
      <div class="grid grid-cols-2 gap-[1rem]">
        <Button class={$theme.buttonSecondary} on:click={toggleModal} type="button">Cancel</Button>
        <Button class={$theme.buttonDelete} type="submit">Delete</Button>
      </div>
    </Form>
  </Modal>
</div>
