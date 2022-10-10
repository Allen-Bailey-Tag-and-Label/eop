<script>
  import { page } from '$app/stores';
  import { Button, Fieldset, Form, Input, Select, Textarea, TitleBar } from '$components';
  import { clientConnection as socketio } from '$lib/socketio';
  import { collections, routeStates } from '$stores';
  import codesAndDescriptions from '../codes-and-descriptions';

  // utilities

  // handlers
  const submitHandler = async (e) => {
    e.preventDefault();

    const { costCenter, jobCode, jobTitle, eeoClassification, workCompClass } =
      $routeStates[$page.url.pathname].jobTitle;

    const insert = {
      user: $routeStates[$page.url.pathname]._userId,
      costCenter,
      jobCode,
      jobTitle,
      eeoClassification,
      workCompClass,
      change: {
        after: +$routeStates[$page.url.pathname].newPCR.after.replace(/\$/g, ''),
        code: $routeStates[$page.url.pathname].newPCR.code,
        date: $routeStates[$page.url.pathname].newPCR.date,
        description: $routeStates[$page.url.pathname].newPCR.description,
        explanation: $routeStates[$page.url.pathname].newPCR.explanation,
        percent: +$routeStates[$page.url.pathname].newPCR.percent.replace(/\%/g, ''),
        previous: +$routeStates[$page.url.pathname].newPCR.previous.replace(/\$/g, '')
      },
      previous: {
        after: $routeStates[$page.url.pathname].previousPCR.change.after,
        code: $routeStates[$page.url.pathname].previousPCR.change.code,
        date: $routeStates[$page.url.pathname].previousPCR.change.date,
        description: $routeStates[$page.url.pathname].previousPCR.change.description,
        explanation: $routeStates[$page.url.pathname].previousPCR.change.explanation,
        percent: $routeStates[$page.url.pathname].previousPCR.change.percent,
        previous: $routeStates[$page.url.pathname].previousPCR.change.previous
      },
      status: 'Submitted'
    };
    const formData = new FormData();
    formData.append('collection', 'pay-change-requests');
    formData.append('insert', JSON.stringify(insert));

    const response = await fetch('/api/db?/create', {
      body: formData,
      method: 'POST'
    });
    const {
      data: { doc }
    } = await response.json();
    socketio.emit('db.create.doc', { collection: 'pay-change-requests', doc });
  };
  const userChangeHandler = () => {
    $routeStates[$page.url.pathname].previousPCR =
      [...$collections['pay-change-requests']]
        .filter(({ user }) => user === $routeStates[$page.url.pathname]._userId)
        .sort((a, b) =>
          a.change.date < b.change.date ? 1 : a.change.date > b.change.date ? -1 : 0
        )[0] || {};
    $routeStates[$page.url.pathname].newPCR.previous = format.currency(
      $routeStates[$page.url.pathname].previousPCR?.change?.after || 0
    );
    $routeStates[$page.url.pathname].newPCR.after =
      $routeStates[$page.url.pathname].newPCR.previous;
    $routeStates[$page.url.pathname].newPCR.percent = format.percent(0);
  };

  // props (internal)
  const codeOptions = Object.keys(codesAndDescriptions)
    .map((code) => {
      return { label: code, value: code };
    })
    .sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
  const descriptionOptions = Object.values(codesAndDescriptions)
    .map((description) => {
      return { label: description, value: description };
    })
    .sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
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
  let userOptions = [];

  // props (external)
  export let data;
  export let title = 'PCR - Submit';
  export let userFilterFn = ({ department, user }) =>
    user._id !== data.user._id && user.department === department._id;

  // props (dynamic)
  $: if ($routeStates?.[$page.url.pathname] === undefined) {
    let date = new Date();
    const day = date.getDay();
    const dayOffset = 14 + ((7 - day) % 7);
    date = new Date(date.getTime() + 1000 * 60 * 60 * 24 * dayOffset);

    $routeStates[$page.url.pathname] = {
      _userId: '',
      jobTitle: {},
      newPCR: {
        after: format.currency(0),
        code: '',
        date: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
          .getDate()
          .toString()
          .padStart(2, '0')}`,
        description: '',
        explanation: '',
        percent: format.percent(0),
        previous: format.currency(0)
      },
      previousPCR: {},
      user: {}
    };
  }
  $: if ($collections['job-titles'] && $routeStates?.[$page.url.pathname]?._userId) {
    $routeStates[$page.url.pathname].jobTitle = $collections['job-titles'].find(
      ({ _id }) => _id === $routeStates[$page.url.pathname].user.jobTitle
    );
  }
  $: if ($collections.users) {
    $routeStates[$page.url.pathname].user =
      $collections.users.find(({ _id }) => _id === $routeStates?.[$page.url.pathname]?._userId) ||
      {};
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
    <Fieldset legend="Employee">
      <Select
        let
        user=""
        ;
        bind:value={$routeStates[$page.url.pathname]._userId}
        class="self-start"
        on:change={userChangeHandler}
        options={userOptions}
      />
    </Fieldset>
    {#if $routeStates[$page.url.pathname]._userId !== ''}
      <div class="flex flex-col space-y-[2rem] lg:flex-row lg:space-y-0 lg:space-x-[2rem]">
        <div class="flex flex-col space-y-[1rem] lg:items-start lg:flex-grow">
          <div class="font-bold">Last Change</div>
          <Fieldset legend="Effective Date">
            <Input
              disabled={true}
              readonly={true}
              type="date"
              value={$routeStates[$page.url.pathname].previousPCR?.change?.date}
            />
          </Fieldset>
          <div class="flex flex-col space-y-[1rem] lg:flex-row lg:space-y-0 lg:space-x-[1rem]">
            <Fieldset
              legend={`Previous (${
                $routeStates[$page.url.pathname].previousPCR?.change?.exempt ? 'Annually' : 'Hourly'
              })`}
            >
              <Input
                class="text-right lg:w-[8rem]"
                disabled={true}
                readonly={true}
                value={format.currency(
                  $routeStates[$page.url.pathname].previousPCR?.change?.previous
                )}
              />
            </Fieldset>
            <Fieldset
              legend={`After (${
                $routeStates[$page.url.pathname].previousPCR?.change?.exempt ? 'Annually' : 'Hourly'
              })`}
            >
              <Input
                class="text-right lg:w-[8rem]"
                disabled={true}
                readonly={true}
                value={format.currency($routeStates[$page.url.pathname].previousPCR?.change?.after)}
              />
            </Fieldset>
            <Fieldset legend="Percent">
              <Input
                class="text-right lg:w-[5rem]"
                disabled={true}
                readonly={true}
                value={format.percent(
                  $routeStates[$page.url.pathname].previousPCR?.change?.after /
                    $routeStates[$page.url.pathname].previousPCR?.change?.previous -
                    1
                )}
              />
            </Fieldset>
          </div>
          <div class="flex flex-col space-y-[1rem] lg:flex-row lg:space-y-0 lg:space-x-[1rem]">
            <Fieldset legend="Code">
              <Select
                class="text-right"
                disabled={true}
                options={codeOptions}
                readonly={true}
                value={$routeStates[$page.url.pathname].previousPCR?.change?.code}
              />
            </Fieldset>
            <Fieldset legend="Description">
              <Select
                disabled={true}
                options={descriptionOptions}
                readonly={true}
                value={$routeStates[$page.url.pathname].previousPCR?.change?.description}
              />
            </Fieldset>
          </div>
          <Fieldset class="w-full" legend="Explanation">
            <Textarea
              disabled={true}
              readonly={true}
              value={$routeStates[$page.url.pathname].previousPCR?.change?.explanation}
            />
          </Fieldset>
        </div>
        <div class="flex flex-col space-y-[1rem] lg:items-start lg:flex-grow">
          <div class="font-bold">New Change</div>
          <Fieldset legend="Effective Date">
            <Input type="date" value={$routeStates[$page.url.pathname].newPCR.date} />
          </Fieldset>
          <div class="flex flex-col space-y-[1rem] lg:flex-row lg:space-y-0 lg:space-x-[1rem]">
            <Fieldset
              legend={`Previous (${
                $routeStates[$page.url.pathname].newPCR?.exempt ? 'Annually' : 'Hourly'
              })`}
            >
              <Input
                class="text-right lg:w-[8rem]"
                disabled={true}
                readonly={true}
                value={$routeStates[$page.url.pathname].newPCR.previous}
              />
            </Fieldset>
            <Fieldset
              legend={`After (${
                $routeStates[$page.url.pathname].newPCR?.exempt ? 'Annually' : 'Hourly'
              })`}
            >
              <Input
                bind:value={$routeStates[$page.url.pathname].newPCR.after}
                class="text-right lg:w-[8rem]"
                on:blur={() => {
                  $routeStates[$page.url.pathname].newPCR.after = format.currency(
                    +$routeStates[$page.url.pathname].newPCR.after.replace(/\$/g, '')
                  );
                }}
                on:keyup={() => {
                  $routeStates[$page.url.pathname].newPCR.percent = format.percent(
                    +$routeStates[$page.url.pathname].newPCR.after.replace(/\$/g, '') /
                      +$routeStates[$page.url.pathname].newPCR.previous.replace(/\$/g, '') -
                      1
                  );
                }}
              />
            </Fieldset>
            <Fieldset legend="Percent">
              <Input
                bind:value={$routeStates[$page.url.pathname].newPCR.percent}
                class="text-right lg:w-[5rem]"
                on:blur={() => {
                  $routeStates[$page.url.pathname].newPCR.percent = format.percent(
                    +$routeStates[$page.url.pathname].newPCR.percent.replace(/\%/g, '') / 100
                  );
                }}
                on:keyup={() => {
                  $routeStates[$page.url.pathname].newPCR.after = format.currency(
                    +$routeStates[$page.url.pathname].newPCR.previous.replace(/\$/g, '') *
                      (1 +
                        +$routeStates[$page.url.pathname].newPCR.percent.replace(/\%/g, '') / 100)
                  );
                }}
              />
            </Fieldset>
          </div>
          <div class="flex flex-col space-y-[1rem] lg:flex-row lg:space-y-0 lg:space-x-[1rem]">
            <Fieldset legend="Code">
              <Select
                bind:value={$routeStates[$page.url.pathname].newPCR.code}
                class="text-right"
                on:change={() => {
                  $routeStates[$page.url.pathname].newPCR.description =
                    codesAndDescriptions[$routeStates[$page.url.pathname].newPCR.code];
                }}
                options={codeOptions}
              />
            </Fieldset>
            <Fieldset legend="Description">
              <Select
                bind:value={$routeStates[$page.url.pathname].newPCR.description}
                on:change={() => {
                  $routeStates[$page.url.pathname].newPCR.code = Object.keys(
                    codesAndDescriptions
                  ).find(
                    (key) =>
                      codesAndDescriptions[key] ===
                      $routeStates[$page.url.pathname].newPCR.description
                  );
                }}
                options={descriptionOptions}
              />
            </Fieldset>
          </div>
          <Fieldset class="w-full" legend="Explanation">
            <Textarea bind:value={$routeStates[$page.url.pathname].newPCR.explanation} />
          </Fieldset>
        </div>
      </div>
      <Button class="self-end" type="submit">Submit</Button>
    {/if}
  </Form>
</div>
