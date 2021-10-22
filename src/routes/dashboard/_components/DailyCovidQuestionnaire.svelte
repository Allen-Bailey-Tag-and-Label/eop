<script>
  // _imports
  import { objectToUrlQueryParams, serverFetch } from '$lib/_helpers.js';
  import auth from '$lib/auth';
  import moment from 'moment';
  import { onMount } from 'svelte';

  // components
  import { Card, Button, Spinner } from '$components';

  // props ( internal )
  let alreadySubmitted = false;
  const date = moment().format('MM.DD.YYYY');
  let loaded = false;

  onMount(async () => {
    const query = {
      auth: $auth,
      from: moment(date, 'MM.DD.YYYY').startOf('day').format('x'),
      to: moment(date, 'MM.DD.YYYY').endOf('day').format('x'),
    }
    const { rows } = await serverFetch(`/api/covid/daily-questionnaire/date-range?${objectToUrlQueryParams(query)}`);
    if ( rows.length >= 1 ) {
      alreadySubmitted = rows[rows.length-1];
    }
    loaded = true;
  })
</script>

<Card class="items-center w-full space-y-[2rem]">
  <div class="font-bold w-full text-[1.25rem]">COVID Daily Questionnaire</div>
  {#if alreadySubmitted !== false}
    <div class="w-full">Status: <span class="{alreadySubmitted.approved ? 'text-green-500' : 'text-red-500'}">{alreadySubmitted.approved ? 'Approved' : 'Unapproved'}</span> for work.</div>
    <Button type="link" href="/covid/daily-questionnaire?state=update">Update Answers</Button>
  {:else if !loaded}
    <Spinner/>
  {:else}
    <div class="w-full">Status: <span class="text-red-500">Unsubmitted</span>.</div>
    <Button type="link" href="/covid/daily-questionnaire">Submit Answers</Button>
  {/if}
</Card>