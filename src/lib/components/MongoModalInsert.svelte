<script>
  import { Button, Fieldset, Form, Input, Modal } from '$components';
  import { postFetch } from '$lib/helpers';

  // utilities

  // handlers
  const submitHandler = async (e) => {
    e.preventDefault();
    const response = await postFetch({ body: { collection, insert }, url: '/api/db/insert' });
    const { doc } = await response.json();
    rows = [...rows, doc];
    toggleModal();
  };

  // props (internal)
  let insert = {};

  // props (external)
  export let collection;
  export let columns = [];
  export let rows = [];
  export let show = false;
  export let toggleModal = () => (show = !show);

  // props (dynamic)
  $: if (Object.keys(insert).length === 0 && columns.length > 0)
    insert = [...columns].reduce((obj, column) => {
      if (column?.key !== undefined && column?.key !== '') obj[column.key] = '';
      return obj;
    }, {});
</script>

<Modal bind:show bind:toggleModal>
  <Form on:submit={submitHandler}>
    {#each columns as column}
      <Fieldset legend={column?.innerHTML}>
        <Input bind:value={insert[column.key]} />
      </Fieldset>
    {/each}
    <Button type="submit">Add</Button>
  </Form>
</Modal>
