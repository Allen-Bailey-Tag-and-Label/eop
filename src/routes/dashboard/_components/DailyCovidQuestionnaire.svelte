<script>
  // _imports
  import { objectToUrlQueryParams, serverFetch } from '$lib/_helpers.js';
  import auth from '$lib/auth';
  import { onMount } from 'svelte';

  // components
  import { Card, Buttons, Spinner } from '$components';
  const { default : Button } = Buttons;

  // handlers
  const submitHandler = async() => {
    modal.spinner.show();
    const body = {
      approved,
      date,
      dateHumanReadable,
      questions,
    }
    let href;
    if ( method === 'POST' ) {
      body.auth = $auth;
      href = '/api/datatable/covid-daily-questionnaire';
    }
    if ( method === 'PATCH' ) href = `/api/datatable/covid-daily-questionnaire?_id=${alreadySubmitted._id}`;
    const doc = await serverFetch({method, href:'/api/datatable/covid-daily-questionnaire', body});
    alreadySubmitted = doc;
    modal.spinner.hide();
    modal.success.show('Successfully submitted daily questionnaire');
  }
  const updateAnswersHandler = () => {
    questions = alreadySubmitted.questions;
    alreadySubmitted = false;
  }

  // props ( internal )
  let alreadySubmitted = false;
  const date = new Date();
  const dateHumanReadable = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  let loaded = false;
  let method = 'POST'
  let questions = [
    { name: 'travel', question: 'Have you traveled to an area subject to self-quarantine within the last 14 days?', value: undefined},
    { name: 'close-contact', question: 'Have you knowingly been in close or proximate contact in the past 10 days with anyone who has tested positive for COVID-19 or who has or had symptoms of COVID-19?', value: undefined},
    { name: 'positive-test', question: 'Have you tested positive for COVID-19 in the past 10 days?', value: undefined},
    { name: 'symptoms', question: 'Have you experienced any symptoms of COVID-19 in the past 10 days?', value: undefined},
  ]

  // props ( dynamic )
  $: approved = [...questions].filter(({value}) => value === true).length === 0;
  $: showSubmit = [...questions].filter(({value}) => value !== undefined).length === questions.length

  // stores
  import modal from '$components/Modal/store';

  onMount(async () => {
    const { rows } = await serverFetch(`/api/datatable/covid-daily-questionnaire?${objectToUrlQueryParams({auth: $auth, dateHumanReadable})}`);
    if ( rows.length === 1 ) {
      alreadySubmitted = rows[0];
      method = 'PATCH';
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