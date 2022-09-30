<script>
  import { Icon, Input, Td } from '$components';
  import { Calendar } from '$icons';
  import { mask } from '$lib/mongoTable';

  // props (external)
  export let collection = '';
  export let column = {};
  // export let columns = [];
  export let editable = true;
  export let i = 0;
  export let j = 0;
  export let keyDownHandler;
  export let row = {};
  // export let rows = [];
  export let updateField;
  export let value = '';
</script>

{#if editable}
  <Td class="p-0 text-center">
    <div class="relative inline-flex">
      <Input
        bind:value
        class="pl-0 pr-[3rem] text-right cursor-pointer rounded-none ring-offset-0 ring-1 focus:ring-primary-500 [&::-webkit-calendar-picker-indicator]:bg-none [&::-webkit-calendar-picker-indicator]:w-0"
        on:blur={(e) => {
          const fieldCollection =
            column?.collection === undefined ? collection : column?.collection;
          const query = { _id: row._id };
          const update = { $set: {} };
          update.$set[column.key] = value;
          updateField({ collection: fieldCollection, query, update });
        }}
        on:keydown={(e) => {
          keyDownHandler({ e, i, j });
        }}
        type="date"
      />
      <div
        class="absolute transform top-1/2 right-0 -translate-y-1/2 -translate-x-full cursor-pointer"
        on:click={(e) => {
          const inputElem = e.target.closest('td').querySelector('input');
          inputElem.showPicker();
        }}
      >
        <Icon src={Calendar} />
      </div>
    </div>
  </Td>
{:else}
  <Td>{mask[column.mask](row[column.key])}</Td>
{/if}
