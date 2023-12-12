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
    Select,
    Tbody,
    Td,
    Th,
    Thead,
    Tr
  } from '$components';
  import { Pencil, Plus, Trash } from '$icons';
  import { theme, toast } from '$stores';
  import { pascalCaseToSentence } from '$utilities';

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
    modal.edit.values = columns.reduce(
      (obj, column) => {
        if (column.getValues !== undefined) obj[column.key] = column.getValues(route);

        return obj;
      },
      { ...route }
    );
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
  export let columns:
    | { key: string; label?: string; type?: string }[]
    | {
        getInnerHTML: Function;
        getValues: Function;
        key: string;
        label?: string;
        options: { label: string; value: string }[];
        type: string;
      }[] = [];
  export let model = '';
  export let rows: { [key: string]: string }[] = [];

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
        id: ''
      }
    }
  };
</script>

<div class="flex flex-col space-y-8 overflow-auto m-[-1.5rem] p-[1.5rem]">
  <Button class={twMerge($theme.buttonIcon, 'self-end')} on:click={modal.create.toggle}>
    <Icon src={Plus} />
  </Button>
  <ResponsiveTable>
    <Thead>
      <Th>Actions</Th>
      {#each columns as { key, label }}
        <Th>{label === undefined ? pascalCaseToSentence(key) : label}</Th>
      {/each}
    </Thead>
    <Tbody>
      {#each rows as row}
        <Tr>
          <Td class="py-2">
            <div class="flex space-x-2 items-center">
              <Button
                class={twMerge($theme.buttonIcon, $theme.buttonSm)}
                on:click={() => editButtonClickHandler(row)}
              >
                <Icon src={Pencil} />
              </Button>
              <Button
                class={twMerge($theme.buttonIcon, $theme.buttonSm, $theme.buttonDelete)}
                on:click={() => deleteButtonClickHandler(row)}
              >
                <Icon src={Trash} />
              </Button>
            </div>
          </Td>
          {#each columns as column}
            <Td>
              {#if column.getInnerHTML === undefined}
                {row[column.key]}
              {/if}
              {#if column.getInnerHTML !== undefined}
                {column.getInnerHTML(row)}
              {/if}
            </Td>
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
      {#each columns as column}
        <Fieldset
          legend={column?.label == undefined ? pascalCaseToSentence(column.key) : column.label}
        >
          {#if column?.type === 'date'}
            <Input name={column.key} type="date" />
          {:else if column?.type === 'many-to-many'}
            <ChipInput name={column.key} options={column.options} />
          {:else if column?.type === 'select'}
            <Select name={column.key} options={column.options} />
          {:else}
            <Input name={column.key} />
          {/if}
        </Fieldset>
      {/each}
    </InputGroup>
    <Button type="submit">Create</Button>
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
      {#each columns as column}
        <Fieldset
          legend={column?.label === undefined ? pascalCaseToSentence(column.key) : column.label}
        >
          {#if column?.type === 'date'}
            <Input bind:value={modal.edit.values[column.key]} name={column.key} type="date" />
          {:else if column?.type === 'many-to-many'}
            <ChipInput
              bind:values={modal.edit.values[column.key]}
              name={column.key}
              options={column.options}
            />
          {:else if column?.type === 'select'}
            <Select
              bind:value={modal.edit.values[column.key]}
              name={column.key}
              options={column.options}
            />
          {:else}
            <Input bind:value={modal.edit.values[column.key]} name={column.key} />
          {/if}
        </Fieldset>
      {/each}
    </InputGroup>
    <Button type="submit">Update</Button>
    <Input bind:value={modal.edit.values.id} class="hidden absolute" name="id" type="hidden" />
  </Form>
</Modal>
