<script>
  // imports
  // import { page } from '$app/stores';
  import { objectToUrlQueryParams, serverFetch } from '$lib/_helpers.js';
  // import auth from '$lib/auth';
  // import moment from 'moment';
  import { onMount } from 'svelte';
  
  // components
  import { Card, Section } from '$components';
  
  // utilities
  const getFAQDocuments = async () => {
    // initiate query
    const query = { category: 'COVID' }

    // get all faq documents
    const { rows: documents } = await serverFetch(`/api/datatable/faq?${objectToUrlQueryParams(query)}`);

    // update rows
    faqs = documents;
  }
  
  // handlers
  
  // props (internal)
  let faqs = []
  
  // props (external)
  
  // props (dynamic)

  // lifecycle
  const lifecycle = {
    destroy: async () => {},
    mount: async () => {
      await getFAQDocuments();
    },
  };
  onMount(async() => {
    await lifecycle.mount();
    return () => {
      lifecycle.destroy();
    }
  });
</script>

<Section>
  <Card class="space-y-[2rem]">
    {#each faqs as {question, answer}}
      <div class="flex flex-col">
        <div class="font-bold text-white whitespace-pre-line">{question}</div>
        <div class="whitespace-pre-line">{answer}</div>
      </div>
    {/each}
  </Card>
</Section>
<slot/>