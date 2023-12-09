<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import { applyAction, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import {
    Button,
    Fieldset,
    Form,
    Icon,
    Input,
    InputGroup,
    Modal,
    ResponsiveTable,
    Tbody,
    Td,
    Th,
    Thead,
    Tr
  } from '$components';
  import { Pencil, Plus, Trash } from '$icons';
  import { theme, toast } from '$stores';

  // handlers
  const createEnhanceHandler = async () => {
    return async ({ result }) => {
      await applyAction(result);
      invalidateAll();
      toast('Successfully created route');
    };
  };
  const deleteButtonClickHandler = (route) => {
    modal.delete.values = { ...route };
    modal.delete.toggle();
  };
  const deleteEnhanceHandler = async () => {
    return async ({ result }) => {
      await applyAction(result);
      invalidateAll();
      modal.delete.toggle();
    };
  };
  const editButtonClickHandler = (route) => {
    modal.edit.values = { ...route };
    modal.edit.toggle();
  };
  const editEnhanceHandler = async () => {
    return async ({ result }) => {
      await applyAction(result);
      invalidateAll();
      modal.edit.toggle();
    };
  };

  // props (external)
  export let data;

  // props (internal)
  const modal = {
    create: {},
    delete: {
      values: {
        id: ''
      }
    },
    edit: {
      values: {
        id: '',
        group: '',
        label: '',
        href: ''
      }
    }
  };
</script>

<div class="flex flex-col space-y-8">
  <Button class={twMerge($theme.buttonIcon, 'self-end')} on:click={modal.create.toggle}>
    <Icon src={Plus} />
  </Button>
  <ResponsiveTable>
    <Thead>
      <Th>Actions</Th>
      <Th>Group</Th>
      <Th>Label</Th>
      <Th>Href</Th>
    </Thead>
    <Tbody>
      {#each data.routes as route}
        <Tr>
          <Td class="py-2">
            <div class="flex space-x-2 items-center">
              <Button
                class={twMerge($theme.buttonIcon, $theme.buttonSm)}
                on:click={() => editButtonClickHandler(route)}
              >
                <Icon src={Pencil} />
              </Button>
              <Button
                class={twMerge($theme.buttonIcon, $theme.buttonSm, $theme.buttonDelete)}
                on:click={() => deleteButtonClickHandler(route)}
              >
                <Icon src={Trash} />
              </Button>
            </div>
          </Td>
          <Td>{route.group}</Td>
          <Td>{route.label}</Td>
          <Td>{route.href}</Td>
        </Tr>
      {/each}
    </Tbody>
  </ResponsiveTable>
</div>

<Modal
  bind:close={modal.create.close}
  bind:isOpen={modal.create.isOpen}
  bind:open={modal.create.open}
  bind:toggle={modal.create.toggle}
>
  <Form action="?/create" use={[[enhance, createEnhanceHandler]]}>
    <InputGroup>
      <Fieldset legend="Group">
        <Input name="group" />
      </Fieldset>
      <Fieldset legend="Label">
        <Input name="label" required="required" />
      </Fieldset>
      <Fieldset legend="Href">
        <Input name="href" required="required" />
      </Fieldset>
    </InputGroup>
    <Button type="submit">Add Route</Button>
  </Form>
</Modal>
<Modal
  bind:close={modal.edit.close}
  bind:isOpen={modal.edit.isOpen}
  bind:open={modal.edit.open}
  bind:toggle={modal.edit.toggle}
>
  <Form action="?/edit" use={[[enhance, editEnhanceHandler]]}>
    <InputGroup>
      <Fieldset legend="Group">
        <Input bind:value={modal.edit.values.group} name="group" />
      </Fieldset>
      <Fieldset legend="Label">
        <Input bind:value={modal.edit.values.label} name="label" required="required" />
      </Fieldset>
      <Fieldset legend="Href">
        <Input bind:value={modal.edit.values.href} name="href" required="required" />
      </Fieldset>
    </InputGroup>
    <Button type="submit">Update Route</Button>
    <Input bind:value={modal.edit.values.id} class="hidden absolute" name="id" type="hidden" />
  </Form>
</Modal>

<Modal
  bind:close={modal.delete.close}
  bind:isOpen={modal.delete.isOpen}
  bind:open={modal.delete.open}
  bind:toggle={modal.delete.toggle}
>
  <!-- <Form action="?/delete" use={[[enhance]]}> -->
  <Form action="?/delete" use={[[enhance, deleteEnhanceHandler]]}>
    <div>Are you sure you want to delete this route?</div>
    <Button class={twMerge($theme.buttonDelete)} type="submit">Delete Route</Button>
    <Input bind:value={modal.delete.values.id} class="hidden absolute" name="id" type="hidden" />
  </Form>
</Modal>
