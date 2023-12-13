<script lang="ts">
  import { DataTable } from '$components';

  // props (external)
  export let data;

  // props (dynamic)
  $: columns = [
    { key: 'title' },
    { key: 'costCenter' },
    { key: 'code' },
    {
      getInnerHTML: (jobTitle) => jobTitle.eeoClassification.toString().padStart(3, '0'),
      key: 'eeoClassification',
      label: 'EEO Classification'
    },
    { key: 'workCompClass' }
  ];

  $: rows = data.jobTitles;
</script>

<DataTable {columns} {rows} />
