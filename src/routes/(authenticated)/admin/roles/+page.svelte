<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import { applyAction, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import {
    Button,
    Checkbox,
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
  const deleteButtonClickHandler = (role) => {
    modal.delete.values = { ...role };
    modal.delete.toggle();
  };
  const deleteEnhanceHandler = async () => {
    return async ({ result }) => {
      await applyAction(result);
      invalidateAll();
      modal.delete.toggle();
    };
  };
  const editButtonClickHandler = (role) => {
    modal.edit.values = { ...role };
    modal.edit.toggle();
  };
  const editEnhanceHandler = async () => {
    return async ({ result }) => {
      await applyAction(result);
      invalidateAll();
      modal.edit.toggle();
    };
  };
  const roleCheckboxClickHandler = async (e, roleId, routeId) => {
    // initiate form data
    const formData = new FormData();

    // append items
    formData.append('checked', e.target.checked);
    formData.append('roleId', roleId);
    formData.append('routeId', routeId);

    // post to server
    await fetch('?/updateCheckbox', {
      body: formData,
      method: 'POST'
    });
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

  // props (dynamic)
  $: routeGroups = data.routes.reduce((obj, route) => {
    // check if group doesn't exist in object
    if (obj?.[route.group] === undefined) obj[route.group] = [];

    // add label to group
    obj[route.group].push(route);

    return obj;
  }, {});
</script>

<div class="flex flex-col space-y-8">
  <Button class={twMerge($theme.buttonIcon, 'self-end')} on:click={modal.create.toggle}>
    <Icon src={Plus} />
  </Button>
  <ResponsiveTable>
    <Thead>
      <Tr>
        <Th rowspan="2">Actions</Th>
        <Th rowspan="2">Name</Th>
        {#each Object.keys(routeGroups) as groupKey}
          <Th class="text-center" colspan={routeGroups[groupKey].length}>{groupKey}</Th>
        {/each}
      </Tr>
      <Tr>
        {#each Object.values(routeGroups) as values}
          {#each values as { label }}
            <Th>{label}</Th>
          {/each}
        {/each}
      </Tr>
    </Thead>
    <Tbody>
      {#each data.roles as role}
        <Tr>
          <Td class="py-2">
            <div class="flex space-x-2 items-center">
              <Button
                class={twMerge($theme.buttonIcon, $theme.buttonSm)}
                on:click={() => editButtonClickHandler(role)}
              >
                <Icon src={Pencil} />
              </Button>
              <Button
                class={twMerge($theme.buttonIcon, $theme.buttonSm, $theme.buttonDelete)}
                on:click={() => deleteButtonClickHandler(role)}
              >
                <Icon src={Trash} />
              </Button>
            </div>
          </Td>
          <Td>{role.name}</Td>
          {#each Object.keys(routeGroups) as groupKey}
            {#each routeGroups[groupKey] as route}
              <Td>
                <Checkbox
                  checked={role.routeIds.includes(route.id)}
                  class="mr-0"
                  on:click={(e) => {
                    roleCheckboxClickHandler(e, role.id, route.id);
                  }}
                />
              </Td>
            {/each}
          {/each}
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
      <Fieldset legend="Name">
        <Input name="name" />
      </Fieldset>
    </InputGroup>
    <Button type="submit">Add</Button>
  </Form>
</Modal>

<Modal
  bind:close={modal.delete.close}
  bind:isOpen={modal.delete.isOpen}
  bind:open={modal.delete.open}
  bind:toggle={modal.delete.toggle}
>
  <Form action="?/delete" use={[[enhance, deleteEnhanceHandler]]}>
    <div>Are you sure you want to delete this route?</div>
    <Button class={twMerge($theme.buttonDelete)} type="submit">Delete</Button>
    <Input bind:value={modal.delete.values.id} class="hidden absolute" name="id" type="hidden" />
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
      <Fieldset legend="Name">
        <Input bind:value={modal.edit.values.name} name="name" />
      </Fieldset>
    </InputGroup>
    <Button type="submit">Update</Button>
    <Input bind:value={modal.edit.values.id} class="hidden absolute" name="id" type="hidden" />
  </Form>
</Modal>
