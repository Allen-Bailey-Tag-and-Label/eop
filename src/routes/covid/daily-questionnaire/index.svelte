<script>
  // _imports
  import { page } from '$app/stores';
  import { objectToUrlQueryParams, serverFetch } from '$lib/_helpers.js';
  import auth from '$lib/auth';
  import moment from 'moment';
  import { onMount } from 'svelte';

  // components
  import { Card, Button, Input, Section, Spinner } from '$components';
  import Boolean from './_components/Boolean.svelte';

  // handlers
  const dateChangeHandler = async () => {
    questions = questions.map(question=>{
      question.value = undefined;
      return question
    })
    const query = {
      auth: $auth,
      from: moment(date, 'MM.DD.YYYY').startOf('day').format('x'),
      to: moment(date, 'MM.DD.YYYY').endOf('day').format('x'),
    }
    loaded = false;
    const { rows } = await serverFetch(`/api/covid/daily-questionnaire/date-range?${objectToUrlQueryParams(query)}`);
    loaded = true
    if ( rows.length > 1 ) {
      alreadySubmitted = rows[rows.length-1];
      _id = alreadySubmitted._id;
      method = 'PATCH';
    } else {
      alreadySubmitted = false;
      _id = undefined;
      method = 'POST';
    }
  }

  const submitHandler = async() => {
    const confirmFN = async () => {
      modal.spinner.show();
      const body = {
        approved,
        date : moment(date, 'MM.DD.YYYY').format('x'),
        questions,
      }
      let href;
      if ( method === 'POST' ) {
        body.auth = $auth;
        href = '/api/covid/daily-questionnaire';
      }
      if ( method === 'PATCH' ) {
        delete body.date;
        href = `/api/covid/daily-questionnaire?_id=${_id}`;
      }
      const doc = await serverFetch({method, href, body});
      console.log(doc);
      alreadySubmitted = doc;
      _id = doc._id;
      modal.spinner.hide();
      modal.success.show('Successfully submitted daily questionnaire');
    }
    modal.confirmation.show(`I certify my answers to be true and accurate.`, confirmFN)
  }
  const updateAnswersHandler = () => {
    questions = alreadySubmitted.questions;
    _id = alreadySubmitted._id;
    alreadySubmitted = false;
  }

  // props ( internal )
  let _id;
  let alreadySubmitted = false;
  let date = moment().format('MM.DD.YYYY');
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
  $: isToday = date === moment().format('MM.DD.YYYY')

  // stores
  import modal from '$components/Modal/store';

  onMount(async () => {
    await dateChangeHandler();
    if ( 'state' in Object.fromEntries($page.query) ) {
      updateAnswersHandler();
    }
    loaded = true;
  })
</script>

<Section>
  <Card class="items-center w-full space-y-[2rem] lg:w-[640px]">
    {#if !loaded}
      <Spinner />
    {:else}
      <div class="w-full flex justify-start">
        <Input on:change={dateChangeHandler} type="date" label="Date" bind:value={date} />
      </div>
      {#if moment(date, 'MM.DD.YYYY').format('x') > moment().endOf('day').format('x')}
        <div>Date cannot be in the future.  Please try again.</div>
      {:else if alreadySubmitted !== false}
        <div class="w-full">Daily COVID Questionnaire has been submitted.</div>
        <div class="w-full">Status: <span class="{alreadySubmitted.approved ? 'text-green-500' : 'text-red-500'}">{alreadySubmitted.approved ? 'Approved' : 'Unapproved'}</span> for work.</div>
        {#if moment(date, 'MM.DD.YYYY').format('MM.DD.YYYY') === moment().format('MM.DD.YYYY')}
          <Button on:click={updateAnswersHandler}>Update Answers</Button>
        {/if}
      {:else}
        {#if isToday}
          <form on:submit|preventDefault={submitHandler} class="flex flex-col space-y-[2rem]">
            {#each questions as {name, question, value}, i}
              <Boolean {name} number={i+1} {question} bind:value />
            {/each}
            <Button type="submit" class="transform {showSubmit ? 'scale-[1]' : 'scale-[0]'}">Submit</Button>
          </form>
        {:else}
          <div class="w-full">Daily COVID Questionnaire was <span class="text-warning-500">unsubmitted</span>.</div>
        {/if}
      {/if}
    {/if}
  </Card>
</Section>