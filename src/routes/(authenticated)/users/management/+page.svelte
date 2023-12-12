<script lang="ts">
  import { DataTable } from '$components';

  // props (external)
  export let data;

  // props (dynamic)
  $: jobTitleOptions = data.jobTitles.map((jobTitle) => {
    return { label: jobTitle.title, value: jobTitle.id };
  });
  $: columns = [
    { key: 'firstName', label: 'First' },
    { key: 'lastName', label: 'Last' },
    { key: 'ennisId', label: 'Ennis ID' },
    { key: 'email', label: 'Email' },
    {
      getInnerHTML: (userProfile) => userProfile.jobTitle?.title || '',
      key: 'jobTitleId',
      label: 'Title',
      options: jobTitleOptions,
      type: 'select'
    }
  ];

  $: rows = data.userProfiles;
</script>

<DataTable {columns} {rows} />
