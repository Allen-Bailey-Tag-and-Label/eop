<script>
  import { Select } from '$components';

  // props (external)
  export let filteredRows = [];
  export let length = 10;
  export let page = 0;
  $: if (page * length >= filteredRows.length) {
    page = Math.ceil(filteredRows.length / length) - 1;
  }

  $: lengthOptions = [
    ...[5, 10, 25, 50, 100]
      .filter((n) => n < filteredRows.length)
      .map((n) => {
        return { label: `${n} / page`, value: n };
      }),
    { label: `${filteredRows.length} (All)`, value: filteredRows.length }
  ];
  $: pageOptions = [...Array(length === 'All' ? 1 : Math.ceil(filteredRows.length / length))].map(
    (_, i) => {
      return {
        label:
          length === 'All'
            ? `1 - ${filteredRows.length}`
            : `${i * length + 1} - ${Math.min((i + 1) * length, filteredRows.length)}`,
        value: i
      };
    }
  );
  $: pageOptionsLG = pageOptions.map(({ label, value }) => {
    return { label: `Rows ${label}`, value };
  });
</script>

<div class="flex items-center justify-between">
  <Select bind:value={length} class="text-right" options={lengthOptions} />
  <Select bind:value={page} class="text-right lg:hidden" options={pageOptions} />
  <Select bind:value={page} class="text-right hidden lg:block" options={pageOptionsLG} />
</div>
