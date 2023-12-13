<script lang="ts">
  import { DateTime } from 'luxon';
  import { DataTable } from '$components';

  // props (external)
  export let data;

  // props (dynamic)
  $: columns = [
    {
      getInnerHTML: (payChangeRequest) => payChangeRequest.userProfile.firstName,
      key: 'firstName'
    },
    { getInnerHTML: (payChangeRequest) => payChangeRequest.userProfile.lastName, key: 'lastName' },
    { key: 'newDate', label: 'Date', type: 'date' },
    {
      getInnerHTML: (payChangeRequest) => payChangeRequest.userProfile.jobTitle.costCenter,
      key: 'costCenter'
    },
    {
      getInnerHTML: (payChangeRequest) => payChangeRequest.userProfile.ennisId,
      key: 'ennisId'
    },
    {
      getInnerHTML: (payChangeRequest) =>
        DateTime.fromFormat(payChangeRequest.userProfile.dateOfHire, 'yyyy-MM-dd').toFormat(
          'M/d/yyyy'
        ),
      key: 'dateOfHire',
      type: 'date'
    },
    {
      getInnerHTML: (payChangeRequest) => payChangeRequest.userProfile.jobTitle.title,
      key: 'title'
    },
    {
      getInnerHTML: (payChangeRequest) => payChangeRequest.userProfile.jobTitle.code,
      key: 'jobCode'
    },
    {
      getInnerHTML: (payChangeRequest) =>
        payChangeRequest.userProfile.jobTitle.eeoClassification.toString().padStart(3, '0'),
      key: 'eeoClassification',
      label: 'EEO Classification'
    },
    {
      getInnerHTML: (payChangeRequest) => payChangeRequest.userProfile.jobTitle.workCompClass,
      key: 'workCompClass'
    },
    {
      getInnerHTML: (payChangeRequest) => payChangeRequest.userProfile.jobTitle.workCompClass,
      key: 'workCompClass'
    },
    {
      getInnerHTML: (payChangeRequest) =>
        DateTime.fromFormat(payChangeRequest.newDate, 'yyyy-MM-dd').toFormat('M/d/yyyy'),
      key: 'effectiveDate'
    },
    {
      getInnerHTML: (payChangeRequest) => payChangeRequest.newPrevious,
      key: 'previous'
    },
    {
      getInnerHTML: (payChangeRequest) => payChangeRequest.newAfter,
      key: 'afterChange'
    },
    {
      getInnerHTML: (payChangeRequest) => `${Math.floor(payChangeRequest.newPercent * 1000) / 10}%`,
      key: 'percent'
    },
    {
      getInnerHTML: (payChangeRequest) => payChangeRequest.newCode.code,
      key: 'code'
    },
    {
      getInnerHTML: (payChangeRequest) => payChangeRequest.newCode.description,
      key: 'description'
    },
    {
      getInnerHTML: (payChangeRequest) => payChangeRequest.newExplanation,
      key: 'explanation'
    }
  ];
  $: rows = data.payChangeRequests;
</script>

<DataTable {columns} {rows} />
