<script>
  import { Button, Checkbox, Fieldset, Icon, Input, Modal, Select } from '$components';
  import { Filter, X } from '$icons';
  import { theme } from '$stores';

  // handlers
  const addFilter = () => (filters = [...filters, { field: '', operator: '', value: ['', ''] }]);
  const toggleModal = () => (show = !show);

  // props (internal)
  let operatorOptions = {
    checkbox: [
      { label: '', value: '' },
      { label: 'is', value: 'is' },
      { label: 'is not', value: 'is not' }
    ],
    date: [
      { label: '', value: '' },
      { label: 'is', value: 'is' },
      { label: 'is after', value: 'is after' },
      { label: 'is before', value: 'is before' },
      { label: 'is between', value: 'is between' },
      { label: 'is not', value: 'is not' }
    ],
    default: [
      { label: '', value: '' },
      { label: 'contains', value: 'contains' },
      { label: 'does not contain', value: 'does not contain' },
      { label: 'ends with', value: 'ends with' },
      { label: 'is', value: 'is' },
      { label: 'is not', value: 'is not' },
      { label: 'starts with', value: 'starts with' }
    ],
    select: [
      { label: '', value: '' },
      { label: 'is', value: 'is' },
      { label: 'is not', value: 'is not' }
    ]
  };
  let show = false;

  // props (external)
  export let columns = [];
  export let filters = [];

  $: fieldOptions = [
    { label: '', value: '' },
    ...columns.map(({ innerHTML: label, key: value }) => {
      return { label, value };
    })
  ];
  $: if (filters) {
    filters = filters.map((filter) => {
      if (
        columns.find(({ key }) => key === filter.field)?.type === 'checkbox' &&
        filter.value[0] !== true &&
        filter.value[0] !== false
      )
        filter.value[0] = false;
      return filter;
    });
  }
</script>

<Button class={$theme.buttonIcon} on:click={toggleModal}>
  <Icon src={Filter} />
</Button>

<Modal bind:show>
  <div class="inline-grid grid-cols-[auto_auto_auto_auto] gap-x-[.5rem] gap-y-[1rem] items-end">
    {#each [...filters].filter(({ visible = true }) => visible) as filter, i}
      <Fieldset legend="Field">
        <Select bind:value={filter.field} options={fieldOptions} />
      </Fieldset>
      <Fieldset legend="Operator">
        <Select
          bind:value={filter.operator}
          options={columns.find(({ key }) => key === filter.field)?.type === 'checkbox'
            ? operatorOptions.checkbox
            : columns.find(({ key }) => key === filter.field)?.type === 'date'
            ? operatorOptions.date
            : columns.find(({ key }) => key === filter.field)?.type === 'select'
            ? operatorOptions.select
            : operatorOptions.default}
        />
      </Fieldset>
      <Fieldset legend="Filter">
        {#if columns.find(({ key }) => key === filter.field)?.type === 'checkbox'}
          <Checkbox bind:checked={filter.value[0]} class="mt-[1rem]" />
        {:else if columns.find(({ key }) => key === filter.field)?.type === 'date'}
          {#if filter.operator === 'is between'}
            <div class="flex space-x-[1rem]">
              <Input bind:value={filter.value[0]} type="date" />
              <Input bind:value={filter.value[1]} type="date" />
            </div>
          {:else}
            <Input bind:value={filter.value[0]} type="date" />
          {/if}
        {:else if columns.find(({ key }) => key === filter.field)?.type === 'select'}
          <Select
            bind:value={filter.value[0]}
            options={[
              { label: '', value: '' },
              ...columns.find(({ key }) => key === filter.field)?.options
            ]}
          />
        {:else}
          <Input bind:value={filter.value[0]} />
        {/if}
      </Fieldset>
      <Button
        class="{$theme.buttonIcon} bg-red-500 hover:bg-red-600 focus:bg-red-600 focus:ring-red-500/[.3]"
        on:click={() => {
          filters = [...filters.slice(0, i), ...filters.slice(i + 1)];
        }}
      >
        <Icon src={X} />
      </Button>
    {/each}
  </div>
  <div class="mt-[1rem] flex space-x-[1rem] justify-end w-full">
    <Button class="{$theme.buttonSecondary} " on:click={toggleModal} type="button">Close</Button>
    <Button on:click={addFilter}>Add Filter</Button>
  </div>
</Modal>
