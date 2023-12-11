<script lang="ts">
  import { DataTable } from '$components';

  // props (external)
  export let data;

  // props (dynamic)
  $: roleOptions = data.roles.map((role) => {
    return { label: role.name, value: role.id };
  });
  $: columns = [
    { key: 'group', label: 'Group' },
    { key: 'label', label: 'Label' },
    { key: 'href', label: 'Href' },
    {
      getInnerHTML: (route) => route.roles.map((role) => role.name).join(' | '),
      getValues: (route) => route.roles.map((role) => role.id),
      key: 'roles',
      label: 'Roles',
      options: roleOptions,
      type: 'many-to-many'
    }
  ];

  $: rows = data.routes;
</script>

<DataTable {columns} {rows} />
