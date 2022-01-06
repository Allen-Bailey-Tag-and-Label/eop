<script>
  // _imports
  import { page } from '$app/stores';
  import { objectToUrlQueryParams, serverFetch } from '$lib/_helpers.js';
  import auth from '$lib/auth';
  import moment from 'moment';
  import { onMount } from 'svelte';
  import { isFullyVaccinated, questions as initialQuestions } from '../_lib/index.js';

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
    if ( rows.length >= 1 ) {
      alreadySubmitted = rows[rows.length-1];
      _id = alreadySubmitted._id;
      method = 'PATCH';
    } else {
      alreadySubmitted = false;
      _id = undefined;
      method = 'POST';
    }
  }
  const getVaccineStatus = async () => {
    const query = {auth: $auth};
    const { rows } = await serverFetch(`/api/datatable/vaccine-status?${objectToUrlQueryParams(query)}`);

    // update vaccinationStatus
    if ( rows.length === 0 ) {
      vaccinationStatus = {
        immunizationMethod: "Unknown",
        fullyVaccinated: false, 
      }
    }
    if ( rows.length !== 0 ) {
      vaccinationStatus = rows[rows.length-1];

      // initialize fully vacinated var
      vaccinationStatus.fullyVaccinated = isFullyVaccinated({...vaccinationStatus, firstName:'Bob'});
    }
  }  
  const submitHandler = async() => {
    const confirmFn = async () => {
      modal.spinner.show();
      const body = {
        approved: true,
        date : moment(date, 'MM.DD.YYYY').format('x'),
        questions,
      }
      // check if positive test
      if (questions[0].value === true) body.approved = false;

      // check if symptoms
      if (questions[1].value === true ) body.approved = false;

      // check if close contact and unvaccinated
      if (questions[2].value === true && vaccinationStatus.fullyVaccinated === false) body.approved = false;

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
      alreadySubmitted = doc;
      _id = doc._id;
      modal.spinner.hide();
      modal.success.show('Successfully submitted daily questionnaire');
    }
    modal.confirmation.show('I certify my answers to be true and accurate.', confirmFn)
  }
  const updateAnswersHandler = () => {
    questions = alreadySubmitted.questions.map(question=>{
      question.submitted = false;
      return question;
    });
    _id = alreadySubmitted._id;
    alreadySubmitted = false;
  }

  // props ( internal )
  let _id;
  let alreadySubmitted = false;
  let date = moment().format('MM.DD.YYYY');
  let loaded = false;
  let method = 'POST'
  let questions = [];
  let vaccinationStatus = undefined;

  // props ( dynamic )
  $: isToday = date === moment().format('MM.DD.YYYY');
  $: showSubmit = [...questions].filter(({value})=>value === undefined).length === 0

  // stores
  import modal from '$components/Modal/store';

  onMount(async () => {
    questions = initialQuestions;
    await Promise.all([dateChangeHandler(), getVaccineStatus()]);
    if ( 'state' in Object.fromEntries($page.query) ) {
      updateAnswersHandler();
    }
    loaded = true;
  })
</script>

<Section class="flex-grow">
  <Card class="items-center w-full space-y-[2rem] flex-grow lg:w-[640px] lg:flex-grow-0">
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
          <form on:submit|preventDefault={submitHandler} class="flex flex-col flex-grow space-y-[2rem]">
            <div class="flex flex-col flex-grow space-y-[2rem]">
              {#each questions as {name, question, value}, i}
                <Boolean {i} {name} {question} bind:value={value} />
              {/each}
            </div>
            <Button type="submit" class="transform {showSubmit ? 'scale-[1]' : 'scale-[0]'}">Submit</Button>
          </form>
        {:else}
          <div class="w-full">Daily COVID Questionnaire was <span class="text-warning-500">unsubmitted</span>.</div>
        {/if}
      {/if}
    {/if}
  </Card>
</Section>
<slot/>