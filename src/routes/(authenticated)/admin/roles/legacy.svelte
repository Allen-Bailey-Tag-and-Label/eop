<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import { applyAction, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import {
    Button,
    ChipInput,
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
    modal.edit.values = {
      ...role,
      routes: role.routes.map((route) => route.id),
      users: role.users.map((user) => user.id)
    };
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
        name: '',
        routes: '',
        users: ''
      }
    }
  };

  // props (dynamic)
  $: routeOptions = data.routes.map(({ id, group, label }) => {
    return { label: [group, label].filter((value) => value !== '').join(' - '), value: id };
  });
  $: userOptions = data.users.map(({ id, profile }) => {
    return {
      label: [profile?.firstName, profile?.lastName].filter((value) => value !== '').join(' '),
      value: id
    };
  });
</script>

<div class="flex flex-col space-y-8">
  <Button class={twMerge($theme.buttonIcon, 'self-end')} on:click={modal.create.toggle}>
    <Icon src={Plus} />
  </Button>
  <ResponsiveTable>
    <Thead>
      <Th>Actions</Th>
      <Th>Name</Th>
      <Th>Routes</Th>
      <Th>Users</Th>
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
          <Td>
            {role.routes
              .sort((a, b) => {
                if (a.group < b.group) return -1;
                if (a.group > b.group) return 1;
                if (a.label < b.label) return -1;
                if (a.label > b.label) return 1;
                return 0;
              })
              .map((route) =>
                [route.group, route.label].filter((string) => string !== '').join(' - ')
              )
              .join(' | ')}
          </Td>
          <Td>
            {role.users
              .sort((a, b) => {
                if (a.profile.firstName < b.profile.firstName) return -1;
                if (a.profile.firstName > b.profile.firstName) return 1;
                if (a.profile.lastName < b.profile.lastName) return -1;
                if (a.profile.lastName > b.profile.lastName) return 1;
                return 0;
              })
              .map((user) =>
                [user.profile.firstName, user.profile.lastName]
                  .filter((string) => string !== '')
                  .join(' ')
              )
              .join(' | ')}
          </Td>
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
      <Fieldset legend="Routes">
        <ChipInput name="routes" options={routeOptions} />
      </Fieldset>
      <Fieldset legend="Users">
        <ChipInput name="users" options={userOptions} />
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
      <Fieldset legend="Routes">
        <ChipInput bind:values={modal.edit.values.routes} name="routes" options={routeOptions} />
      </Fieldset>
      <Fieldset legend="Users">
        <ChipInput bind:values={modal.edit.values.users} name="users" options={userOptions} />
      </Fieldset>
    </InputGroup>
    <Button type="submit">Update</Button>
    <Input bind:value={modal.edit.values.id} class="hidden absolute" name="id" type="hidden" />
  </Form>
</Modal>
