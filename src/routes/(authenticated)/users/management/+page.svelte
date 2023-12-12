<script lang="ts">
  import { DateTime } from 'luxon';
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
    {
      getInnerHTML: (userProfile) =>
        // userProfile.dateOfHire,
        DateTime.fromFormat(userProfile.dateOfHire, 'yyyy-MM-dd').toFormat('M/d/yyyy'),
      key: 'dateOfHire',
      type: 'date'
    },
    { key: 'ennisId' },
    { key: 'email' },
    {
      getInnerHTML: (userProfile) => userProfile.jobTitle?.title || '',
      key: 'jobTitleId',
      label: 'Job Title',
      options: jobTitleOptions,
      type: 'select'
    }
  ];

  $: rows = data.userProfiles;
</script>

<DataTable {columns} {rows} />
