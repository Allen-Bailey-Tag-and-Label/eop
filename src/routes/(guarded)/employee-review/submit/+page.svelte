<script>
  import { page } from '$app/stores';
  import { Button, Fieldset, Form, Input, Radio, Select, Textarea, TitleBar } from '$components';
  import { clientConnection as socketio } from '$lib/socketio';
  import { collections, routeStates } from '$stores';

  // utilities

  // handlers
  const submitHandler = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('collection', 'employee-reviews');
    const insert = $routeStates[$page.url.pathname];
    insert.date = `${new Date().getFullYear()}-${(new Date().getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}`;
    formData.append('insert', JSON.stringify(insert));

    const response = await fetch('/api/db?/create', {
      body: formData,
      method: 'POST'
    });
    const {
      data: { doc }
    } = await response.json();
    socketio.emit('db.create.doc', { collection: 'employee-reviews', doc });
  };

  // props (internal)
  let jobTitleOptions = [];
  const potentialForAdvancments = [
    'Should be considered for promotion',
    'Good potential, but needs additional training or experience',
    'Limited potential beyond present level'
  ];
  let userOptions = [];

  // props (external)
  export let data;
  export let title = 'Employee Review - Submit';
  export let userFilterFn = ({ department, user }) =>
    user._id !== data.user._id && user.department === department._id;

  // props (dynamic)
  $: if ($routeStates?.[$page.url.pathname] === undefined) {
    $routeStates[$page.url.pathname] = {
      evaluator: data?.user?._id,
      jobTitle: {},
      majorOpportunitiesForImprovements: '',
      majorStrengths: '',
      potentialForAdvancment: '',
      ratings: [...initialRatings],
      recommendedDevelopmentPlan: '',
      user: ''
    };
  }
  $: initialRatings =
    [...$collections?.['employee-ratings']]
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      .map(({ name: legend }) => {
        return {
          legend,
          key: legend
            ?.split(' ')
            ?.map((word, i) =>
              i === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1)
            )
            ?.join(''),
          value: 0
        };
      }) || [];
  $: if ($collections['job-titles']) {
    jobTitleOptions = [
      { label: '', value: '' },
      ...[...$collections['job-titles']].map(({ _id, jobTitle }) => {
        return { label: jobTitle, value: _id };
      })
    ].sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
  }
  $: if (
    $collections['job-titles'] &&
    $collections.users &&
    $routeStates[$page.url.pathname].user
  ) {
    const user = $collections.users.find(
      ({ _id }) => _id === $routeStates?.[$page.url.pathname]?.user
    );
    $routeStates[$page.url.pathname].user = user?._id;
    $routeStates[$page.url.pathname].jobTitle = $collections['job-titles'].find(
      ({ _id }) => _id === user?.jobTitle
    )._id;
  }
  $: if ($collections.users) {
    const department = $collections.departments.find(
      ({ supervisor }) => supervisor === data.user._id
    );
    userOptions = [
      { label: '-- Select and Employee', value: '' },
      ...[...$collections.users]
        .filter((user) => userFilterFn({ user, department }))
        .map(({ _id, firstName, lastName }) => {
          return { label: `${firstName} ${lastName}`, value: _id };
        })
    ].sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
  }
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">{title}</svelte:fragment>
  </TitleBar>
  <Form
    class="flex flex-col overflow-y-auto p-[2rem] space-y-[2rem] max-w-none"
    on:submit={submitHandler}
    use={[]}
  >
    <div class="flex flex-col space-y-[1rem] lg:flex-row lg:space-y-0 lg:space-x-[1rem]">
      <Fieldset legend="Employee">
        <Select
          bind:value={$routeStates[$page.url.pathname].user}
          class="self-start"
          options={userOptions}
        />
      </Fieldset>
      {#if $routeStates[$page.url.pathname].user !== ''}
        <Fieldset legend="Job Title">
          <Select
            disabled={true}
            options={jobTitleOptions}
            readonly={true}
            value={$routeStates[$page.url.pathname].jobTitle}
          />
        </Fieldset>
      {/if}
    </div>

    {#if $routeStates[$page.url.pathname].user !== ''}
      <div class="flex flex-col space-y-[2rem] lg:flex-row lg:space-y-0 lg:space-x-[2rem]">
        <div class="flex flex-col space-y-[1rem] lg:items-start">
          <div class="grid grid-cols-[auto_auto_auto_auto_auto] gap-[1rem] items-center">
            <div class="font-bold">Ratings</div>
            {#each [...Array(4)] as _, i}
              <div class="text-center">{i}</div>
            {/each}
            {#each $routeStates[$page.url.pathname].ratings as rating}
              <div>{rating.legend}</div>
              {#each [...Array(4)] as _, i}
                <div class="text-center">
                  <Radio bind:group={rating.value} class="mx-auto" value={i} />
                </div>
              {/each}
            {/each}
            <div class="font-bold">Total</div>
            <div class="text-right col-span-4">
              {[...$routeStates[$page.url.pathname].ratings].reduce((t, obj) => t + obj.value, 0)} /
              {$routeStates[$page.url.pathname].ratings.length * 3}
            </div>
          </div>
        </div>
        <div class="flex flex-col space-y-[2rem] flex-grow">
          <Fieldset legend="Major Strengths">
            <Textarea bind:value={$routeStates[$page.url.pathname].majorStrengths} />
          </Fieldset>
          <Fieldset legend="Major Opportunities for Improvements">
            <Textarea
              bind:value={$routeStates[$page.url.pathname].majorOpportunitiesForImprovements}
            />
          </Fieldset>
          <Fieldset legend="Potential for Advancement">
            {#each potentialForAdvancments as potentialForAdvancment}
              <Radio
                bind:group={$routeStates[$page.url.pathname].potentialForAdvancment}
                class="mr-[1rem]"
                value={potentialForAdvancment}
              >
                {potentialForAdvancment}
              </Radio>
            {/each}
          </Fieldset>
          <Fieldset legend="Recommended Development Plan">
            <Textarea bind:value={$routeStates[$page.url.pathname].recommendedDevelopmentPlan} />
          </Fieldset>
        </div>
      </div>
    {/if}
    <Button class="lg:self-end" type="submit">Submit</Button>
  </Form>
</div>
