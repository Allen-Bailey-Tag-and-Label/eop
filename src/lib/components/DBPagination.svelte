<script>
  import { Select } from '$components';

  // props (external)
  export let filteredRows = [];
  export let length = 10;
  export let page = 0;
  $: if (page * length > filteredRows.length) {
    page = Math.ceil(filteredRows.length / length) - 1;
  }
</script>

<div class="flex items-center justify-between">
  <Select
    bind:value={length}
    class="text-right"
    options={[5, 10, 25, 50, 100, 'All'].map((n) => {
      if (n === 'All') return { label: `${filteredRows.length} (All)`, value: filteredRows.length };
      return { label: `${n} / page`, value: n };
    })}
  />
  <Select
    bind:value={page}
    class="text-right"
    options={[...Array(length === 'All' ? 1 : Math.ceil(filteredRows.length / length))].map(
      (_, i) => {
        return {
          label:
            length === 'All'
              ? `1 - ${filteredRows.length}`
              : `${i * length + 1} - ${Math.min((i + 1) * length, filteredRows.length)}`,
          value: i
        };
      }
    )}
  />
</div>
