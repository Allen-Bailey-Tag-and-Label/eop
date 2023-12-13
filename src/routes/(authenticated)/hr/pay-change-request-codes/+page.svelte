<script lang="ts">
  import { DataTable } from '$components';

  // props (external)
  export let data;

  // props (internal)
  let isReadonly = true;

  // props (dynamic)
  $: columns = [{ key: 'code' }, { key: 'description' }];
  $: rows = data.payChangeRequestCodes;
  $: if (data.user.profile.roles.find((role) => role.name === 'Admin') !== undefined) {
    isReadonly = false;
  }
</script>

<DataTable {columns} {isReadonly} {rows} />
