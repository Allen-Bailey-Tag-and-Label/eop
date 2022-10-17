<script>
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import {
    Button,
    Fieldset,
    Form,
    Input,
    Radio,
    Range,
    Select,
    Textarea,
    TitleBar
  } from '$components';
  import { clientConnection as socketio } from '$lib/socketio';
  import { collections, routeStates } from '$stores';

  // utilities
  const formReset = () => {
    $routeStates[$page.url.pathname] = {
      department: '',
      evaluator: data?.user?._id,
      jobTitle: {},
      majorOpportunitiesForImprovements: '',
      majorStrengths: '',
      potentialForAdvancement: '',
      ratings: { ...initialRatings },
      recommendedDevelopmentPlan: '',
      reviewFrom: [
        new Date().getFullYear() - 1,
        new Date().getMonth() + 1,
        new Date().getDate() + 1
      ]
        .map((date) => date.toString().padStart(2, '0'))
        .join('-'),
      reviewTo: [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()]
        .map((date) => date.toString().padStart(2, '0'))
        .join('-'),
      user: ''
    };
  };

  // handlers
  const submitHandler = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('collection', 'employee-reviews');
    if (_id) {
      formData.append('query', JSON.stringify({ _id }));
      const update = {
        $set: Object.keys($routeStates[$page.url.pathname]).reduce((obj, key) => {
          obj[key] = $routeStates[$page.url.pathname][key];
          return obj;
        }, {})
      };
      formData.append('update', JSON.stringify(update));
    }
    if (_id === undefined) {
      const insert = Object.keys($routeStates[$page.url.pathname]).reduce((obj, key) => {
        obj[key] = $routeStates[$page.url.pathname][key];
        return obj;
      }, {});
      insert.date = `${new Date().getFullYear()}-${(new Date().getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}`;
      formData.append('insert', JSON.stringify(insert));
    }

    const response = await fetch(`/api/db?/${_id ? 'update' : 'create'}`, {
      body: formData,
      method: 'POST'
    });
    const {
      data: { doc }
    } = await response.json();
    socketio.emit(`db.${_id ? 'update' : 'create'}.doc`, { collection: 'employee-reviews', doc });
    if (_id !== undefined && browser) window.history.back();
    if (_id === undefined) formReset();
  };

  // props (internal)
  let departmentOptions = [];
  let jobTitleOptions = [];
  const potentialForAdvancements = [
    { label: 'N/A', value: '' },
    ...[
      'Should be considered for promotion',
      'Good potential, but needs additional training or experience',
      'Limited potential beyond present level'
    ].map((s) => {
      return { label: s, value: s };
    })
  ];
  let userOptions = [];

  // props (external)
  export let _id;
  export let data;
  export let title = 'Employee Review - Submit';
  export let userFilterFn = ({ department, user }) =>
    user._id !== data.user._id && user.department === department._id;

  // props (dynamic)
  $: initialRatings =
    [...$collections?.['employee-ratings']]
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      .reduce((obj, rating) => {
        const key = rating.name[0].toLowerCase() + rating.name.slice(1).replace(' ', '');
        obj[key] = 1;
        return obj;
      }, {}) || {};
  $: if ($collections['employee-reviews'] && $routeStates?.[$page.url.pathname] === undefined) {
    if (_id !== undefined)
      $routeStates[$page.url.pathname] = $collections['employee-reviews'].find(
        (doc) => doc._id === _id
      );
    if (_id === undefined) formReset();
  }
  $: if ($collections['departments']) {
    departmentOptions = [
      { label: '', value: '' },
      ...[...$collections['departments']].map(({ _id, name }) => {
        return { label: name, value: _id };
      })
    ].sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
  }
  $: if ($collections['job-titles']) {
    jobTitleOptions = [
      { label: '', value: '' },
      ...[...$collections['job-titles']].map(({ _id, jobTitle }) => {
        return { label: jobTitle, value: _id };
      })
    ].sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
  }
  $: if (
    $collections.departments &&
    $collections['job-titles'] &&
    $collections.users &&
    $routeStates[$page.url.pathname].user
  ) {
    const user = $collections.users.find(
      ({ _id }) => _id === $routeStates?.[$page.url.pathname]?.user
    );
    $routeStates[$page.url.pathname].user = user?._id;
    $routeStates[$page.url.pathname].department = $collections.departments.find(
      ({ _id }) => _id === user?.department
    )?._id;
    $routeStates[$page.url.pathname].jobTitle = $collections['job-titles'].find(
      ({ _id }) => _id === user?.jobTitle
    )?._id;
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
    <div
      class="flex flex-col space-y-[1rem] lg:flex-row lg:space-y-0 lg:space-x-[1rem] lg:flex-wrap"
    >
      <Fieldset legend="Employee">
        <Select
          disabled={_id ? true : undefined}
          bind:value={$routeStates[$page.url.pathname].user}
          class="self-start"
          options={userOptions}
        />
      </Fieldset>
      {#if $routeStates[$page.url.pathname].user !== ''}
        <Fieldset legend="Department">
          <Select
            disabled={true}
            options={departmentOptions}
            readonly={true}
            value={$routeStates[$page.url.pathname].department}
          />
        </Fieldset>
        <Fieldset legend="Job Title">
          <Select
            disabled={true}
            options={jobTitleOptions}
            readonly={true}
            value={$routeStates[$page.url.pathname].jobTitle}
          />
        </Fieldset>
        <div class="flex flex-col space-y-[1rem] lg:flex-row lg:space-y-0 lg:space-x-[1rem]">
          <Fieldset legend="Review From">
            <Input bind:value={$routeStates[$page.url.pathname].reviewFrom} type="date" />
          </Fieldset>
          <Fieldset legend="Review To">
            <Input bind:value={$routeStates[$page.url.pathname].reviewTo} type="date" />
          </Fieldset>
        </div>
      {/if}
    </div>

    {#if $routeStates[$page.url.pathname].user !== ''}
      <div class="flex flex-col space-y-[2rem] lg:flex-row lg:space-y-0 lg:space-x-[2rem]">
        <div class="flex flex-col space-y-[1rem] lg:items-start">
          <div class="grid grid-cols-[auto_1fr_1rem] gap-[1rem] items-center">
            <div class="font-bold col-span-3">Ratings</div>
            {#each Object.keys($routeStates[$page.url.pathname].ratings) as key}
              <div>{key[0].toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</div>
              <Range bind:value={$routeStates[$page.url.pathname].ratings[key]} max="9" min="1" />
              <div class="text-right">{$routeStates[$page.url.pathname].ratings[key]}</div>
            {/each}
            <div class="font-bold col-span-2">Overall</div>
            <div class="text-right">
              {Math.round(
                [...Object.values($routeStates[$page.url.pathname].ratings)].reduce(
                  (t, v) => t + v,
                  0
                ) / Object.keys($routeStates[$page.url.pathname].ratings).length
              )}
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
            {#each potentialForAdvancements as { label, value }}
              <Radio
                bind:group={$routeStates[$page.url.pathname].potentialForAdvancement}
                class="mr-[1rem]"
                {value}
              >
                {label}
              </Radio>
            {/each}
          </Fieldset>
          <Fieldset legend="Recommended Development Plan">
            <Textarea bind:value={$routeStates[$page.url.pathname].recommendedDevelopmentPlan} />
          </Fieldset>
        </div>
      </div>
      <Button class="lg:self-end" type="submit">{_id ? 'Update' : 'Submit'}</Button>
    {/if}
  </Form>
</div>
