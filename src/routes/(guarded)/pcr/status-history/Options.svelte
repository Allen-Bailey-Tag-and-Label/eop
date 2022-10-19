<script>
  import { A, Button, Td } from '$components';
  import fileGeneration from '$lib/fileGeneration';
  import { collections, theme } from '$stores';

  const format = {
    currency: new Intl.NumberFormat('en-us', {
      style: 'currency',
      currency: 'USD'
    }).format,
    percent: new Intl.NumberFormat('en-us', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format
  };

  const parseDate = (str) => {
    const date = new Date(str);
    return [date.getMonth() + 1, date.getDate() + 1, date.getFullYear()].join('/');
  };

  const objectValueFromDotNotation = (value, str) => {
    let key;
    [key, ...str] = str.split('.');
    value = value?.[key];
    if (str.length === 0) return value;
    if (value === undefined) return undefined;
    str = str.join('.');
    return objectValueFromDotNotation(value, str);
  };

  // handlers
  const downloadPCR = async () => {
    const doc = { ...$collections['pay-change-requests'].find(({ _id }) => _id === row._id) };
    const user = { ...$collections.users.find(({ _id }) => _id === doc.user) };

    // update doc fields
    doc.facilityName = 'Allen-Bailey Tag & Label';
    doc.facilityNumber = '2046';

    const replaceDictionaries = [
      {
        dictionary: {
          employeeNumber: 'ennisId',
          lastName: 'lastName',
          firstName: 'firstName',
          dateOfHire: 'hireDate'
        },
        object: user
      },
      {
        dictionary: {
          previousDate: 'date',
          previousPrevious: 'previous',
          previousAfter: 'after',
          previousPercent: 'percent',
          previousCode: 'code',
          previousDescription: 'description',
          previousExplanation: 'explanation'
        },
        object: doc.previous
      },
      {
        dictionary: {
          changeDate: 'date',
          changePrevious: 'previous',
          changeAfter: 'after',
          changePercent: 'percent',
          changeCode: 'code',
          changeDescription: 'description',
          changeExplanation: 'explanation'
        },
        object: doc.change
      }
    ];

    replaceDictionaries.map(({ dictionary, object }) => {
      Object.keys(dictionary).map((key) => {
        const str = dictionary[key];
        doc[key] = objectValueFromDotNotation(object, str);
      });
    });

    const dateKeys = ['dateOfHire', 'previousDate', 'changeDate'];
    dateKeys.map((key) => {
      doc[key] = doc[key] === undefined ? '' : parseDate(doc[key]);
    });

    const currencyKeys = ['previousPrevious', 'previousAfter', 'changePrevious', 'changeAfter'];
    currencyKeys.map((key) => {
      doc[key] = doc[key] === undefined ? '' : format.currency(doc[key]);
    });

    const percentKeys = ['previousPercent', 'changePercent'];
    percentKeys.map((key) => {
      doc[key] = doc[key] === undefined ? '' : format.percent(doc[key] / 100);
    });

    await fileGeneration({ doc, template: 'pay-change-request', type: 'pdf' });
  };
  const downloadReview = async () => {
    const doc = { ...$collections['employee-reviews'].find(({ _id }) => _id === row.review) };

    // update doc fields
    doc.dateFrom = [
      new Date(doc.dateFrom).getMonth() + 1,
      new Date(doc.dateFrom).getDate() + 1,
      new Date(doc.dateFrom).getFullYear()
    ].join('/');
    doc.dateTo = [
      new Date(doc.dateTo).getMonth() + 1,
      new Date(doc.dateTo).getDate() + 1,
      new Date(doc.dateTo).getFullYear()
    ].join('/');
    doc.department = $collections['departments'].find(({ _id }) => _id === doc.department).name;
    doc.jobTitle = $collections['job-titles'].find(({ _id }) => _id === doc.jobTitle).jobTitle;
    doc.overall = Math.round(
      Object.keys(doc.ratings).reduce((total, key) => {
        total += doc.ratings[key];
        doc[key] = doc.ratings[key];
        return total;
      }, 0) / Object.keys(doc.ratings).length
    );
    delete doc.ratings;
    doc.user = `${$collections.users.find(({ _id }) => _id === doc.user).firstName} ${
      $collections.users.find(({ _id }) => _id === doc.user).lastName
    }`;

    await fileGeneration({ doc, template: 'appraisal-form-hourly', type: 'pdf' });
  };
  const downloadHandler = async () => {
    // await downloadReview();
    await downloadPCR();
  };

  // props (external)
  export let collection = '';
  export let column = {};
  // export let columns = [];
  export let editable = true;
  export let i = 0;
  export let j = 0;
  export let keyDownHandler;
  export let row = {};
  // export let rows = [];
  export let updateField;
  export let value = '';
</script>

<Td class="py-[.25rem]">
  <div class="flex space-x-[1rem] mx-auto justify-center">
    <Button class={$theme.buttonSmall} on:click={downloadHandler}>Download</Button>
    {#if row?.status === 'Submitted'}
      <A
        class="{$theme.button} {$theme.buttonSmall} before:hidden inline-flex"
        href="/pcr/edit?_id={row._id}"
      >
        Edit
      </A>
    {/if}
  </div>
</Td>
