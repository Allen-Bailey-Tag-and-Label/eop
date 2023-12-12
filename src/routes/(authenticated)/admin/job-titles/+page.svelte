<script lang="ts">
  import { DataTable } from '$components';

  // props (external)
  export let data;

  // props (dynamic)
  $: columns = [
    { key: 'title', label: 'Title' },
    { key: 'costCenter', label: 'Cost Center' },
    { key: 'code', label: 'Code' },
    {
      getInnerHTML: (jobTitle) => jobTitle.eeoClassification.toString().padStart(3, '0'),
      key: 'eeoClassification',
      label: 'EEO Classification'
    },
    { key: 'workCompClass', label: 'Work Comp Class' }
  ];

  $: rows = data.jobTitles;
</script>

<DataTable {columns} {rows} />
