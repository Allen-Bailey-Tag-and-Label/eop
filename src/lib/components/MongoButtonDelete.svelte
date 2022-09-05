<script>
  import { Button, Card, Form, H6, Icon, Modal, P } from '$components';
  import { Trash } from '$icons';
  import { postFetch } from '$lib/helpers';
  import { theme } from '$stores';

  // utilities

  // handlers
  const clickHandler = () => {
    toggleModal();
  };
  const submitHandler = async (e) => {
    e.preventDefault();
    const query = {
      $or: [...selectedRows].map(({ _id }) => {
        return { _id };
      })
    };
    await postFetch({ body: { collection, query }, url: '/api/db/delete' });
    const deletedRows = [...selectedRows];
    rows = [...rows].filter(({ _id }) => deletedRows.findIndex((obj) => obj._id === _id) === -1);
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
</script>

{#if selectedRows.length > 0}
  <Button
    class="{$theme.buttonIcon} bg-red-500 hover:bg-red-600 focus:bg-red-600 focus:ring-red-500/[.3]"
    on:click={clickHandler}
  >
    <Icon src={Trash} />
  </Button>
{/if}

<div>
  <Modal bind:show>
    <Form on:submit={submitHandler}>
      <!-- <div
        class="{$theme.card} self-center mt-[-6rem] dark:ring-0 shadow-[0_1rem_2rem_rgba(18,18,18,.3)] dark:shadow-[0_1rem_2rem_rgba(18,18,18,.7)]"
        style="transform: perspective(200px) rotateY(10deg);"
      >
        <Icon class="text-red-500 w-[6rem] h-[6rem] mx-auto" src={Trash} />
      </div> -->
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
