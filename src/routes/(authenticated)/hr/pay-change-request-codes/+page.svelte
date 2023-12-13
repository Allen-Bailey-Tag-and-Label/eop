<script lang="ts">
  import { DataTable } from '$components';

  // props (external)
  export let data;

  // props (dynamic)
  $: columns = [{ key: 'code' }, { key: 'description' }];

  $: rows = data.payChangeRequestCodes;
</script>

<DataTable {columns} {rows} />
