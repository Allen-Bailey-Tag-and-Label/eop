<script>
  import { A, Button, Td } from '$components';
  import fileGeneration from '$lib/fileGeneration';
  import { collections, theme } from '$stores';

  // handlers
  const getDoc = async () => {
    const doc = { ...$collections['employee-reviews'].find(({ _id }) => _id === row._id) };

    // update doc fields
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

    return doc;
  };
  const downloadHandler = async () => {
    const doc = await getDoc();
    await fileGeneration({ doc, template: 'appraisal-form-hourly', type: 'pdf' });
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
    <A
      class="{$theme.button} {$theme.buttonSmall} before:hidden inline-flex"
      href="/employee-review/edit/{row._id}"
    >
      Edit
    </A>
  </div>
</Td>
