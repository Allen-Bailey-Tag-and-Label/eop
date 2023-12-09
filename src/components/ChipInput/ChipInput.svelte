<script lang="ts">
  // imports
  import { current_component } from 'svelte/internal';
  import { twMerge } from 'tailwind-merge';
  import { getEvents } from '$actions';
  import { Button, Chip, Form, Icon, Input, Select } from '$components';
  import { Plus, XMark } from '$icons';
  import { theme } from '$stores';

  // handlers
  const deleteValueHandler = (valueIndex: number) => {
    values = values.filter((_, i) => i !== valueIndex);
  };
  const submitHandler = (e: CustomEvent<void>) => {
    e.preventDefault();
    values = [...values, value];
  };

  // props (external)
  export let allowDuplicates = false;
  export let name: string | undefined = undefined;
  export let options: { label: string; value: string }[] | undefined = undefined;
  export let style: string | undefined = undefined;
  export let use: any[] = [];
  export let values: any[] = [];

  // props (internal)
  const events = getEvents(current_component);
  let uniqueOptions: { label: string; value: string }[] | undefined = undefined;
  let value = '';

  // props (dynamic)
  $: classes = twMerge('', $theme.chipInput, $$props.class);
  $: if (options !== undefined) {
    uniqueOptions = [...options].filter((option) => !values.includes(option.value));
    if (!allowDuplicates && values.includes(value) && uniqueOptions.length > 0)
      value = uniqueOptions[0].value;
  }
</script>

<Form class={classes} on:submit={submitHandler} {style} use={[events, ...use]}>
  <slot>
    {#each values as value, valueIndex}
      <Chip class="pr-2">
        <div class="whitespace-nowrap">
          {#if options === undefined}
            {value}
          {/if}
          {#if options !== undefined}
            {options.find((option) => option.value === value)?.label}
          {/if}
        </div>
        <Button
          class={twMerge($theme.buttonIcon, $theme.buttonXs, $theme.buttonTransparent)}
          on:click={() => deleteValueHandler(valueIndex)}
        >
          <Icon src={XMark} />
        </Button>
      </Chip>
    {/each}
    {#if options === undefined}
      <Input bind:value class="py-[.375rem]" />
    {/if}
    {#if options !== undefined}
      {#if !allowDuplicates && uniqueOptions !== undefined && uniqueOptions.length > 0}
        <Select bind:value class="py-[.375rem]" options={uniqueOptions} />
      {/if}
    {/if}
  </slot>
  {#if options === undefined || allowDuplicates || (uniqueOptions !== undefined && uniqueOptions.length > 0)}
    <Button class={twMerge($theme.buttonIcon, $theme.buttonSm)} type="submit">
      <Icon src={Plus} />
    </Button>
  {/if}
</Form>
<Input
  value={JSON.stringify(values)}
  class="absolute hidden top-0 left-0 opacity-0 pointer-events-none"
  {name}
  type="hidden"
/>
