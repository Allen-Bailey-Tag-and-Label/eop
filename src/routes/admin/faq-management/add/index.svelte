<script>
  // imports
  // import { page } from '$app/stores';
  import modal from '$components/Modal/store';
  import { objectToUrlQueryParams, serverFetch } from '$lib/_helpers.js';
  // import auth from '$lib/auth';
  // import moment from 'moment';
  import { onMount } from 'svelte';
  import categoryOptions from '../categoryOptions';
  
  // components
  import { Button, Buttons, Card, Input, Section, Select, Textarea } from '$components';
  
  // utilities
  
  // handlers
  const submitHandler = async () => {
    // show spinner
    modal.spinner.show();

    try {
      // upload to database
      await serverFetch({
        body: {
          answer,
          category,
          question
        },
        href: '/api/datatable/faq',
        method: 'post',
      });

      // show success modal
      modal.success.show(`Successfully added "${category}" question.`)

      // reset question and answer
      answer = '';
      question = '';
    } catch (error) {
      modal.error.show(error);
    }

    // hide spinner
    modal.spinner.hide();
  }
  
  // props (internal)
  let answer = '';
  let category = 'COVID';
  let question = '';
  
  // props (external)
  
  // props (dynamic)
  
  // lifecycle
  const lifecycle = {
    destroy: async () => {},
    mount: async () => {},
  };
  onMount(async() => {
    await lifecycle.mount();
    return () => {
      lifecycle.destroy();
    }
  });
</script>

<Section class="space-y-[2rem]">
  <div class="flex">
    <Buttons.Back />
  </div>
  <Card>
    <form on:submit|preventDefault={submitHandler} class="flex flex-col w-full items-start space-y-[2rem]">
      <Select label="Category" options={categoryOptions} bind:value={category} />
      <Textarea label="Question" bind:value={question} labelClasses="w-full" />
      <Textarea label="Answer" bind:value={answer} labelClasses="w-full" />
      <Button type="submit">Submit</Button>
    </form>
  </Card>
</Section>
<slot/>