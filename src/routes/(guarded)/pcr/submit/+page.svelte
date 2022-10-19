<script>
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { A, Button, Fieldset, Form, Input, Select, Textarea, TitleBar } from '$components';
  import { clientConnection as socketio } from '$lib/socketio';
  import { collections, routeStates, theme } from '$stores';
  import codesAndDescriptions from '../codes-and-descriptions';

  // utilities
  const formReset = () => {
    let date = new Date();
    const day = date.getDay();
    const dayOffset = 14 + ((7 - day) % 7);
    date = new Date(date.getTime() + 1000 * 60 * 60 * 24 * dayOffset);

    $routeStates[$page.url.pathname] = {
      change: {
        after: format.currency(0),
        code: '',
        date: [date.getFullYear(), date.getMonth() + 1, date.getDate()]
          .map((d) => d.toString().padStart(2, '0'))
          .join('-'),
        description: '',
        explanation: '',
        percent: format.percent(0),
        previous: format.currency(0)
      },
      costCenter: '',
      eeoClassification: '',
      jobCode: '',
      jobTitle: '',
      previous: {
        after: format.currency(0),
        code: '',
        date: [date.getFullYear(), date.getMonth() + 1, date.getDate()]
          .map((d) => d.toString().padStart(2, '0'))
          .join('-'),
        description: '',
        explanation: '',
        percent: format.percent(0),
        previous: format.currency(0)
      },
      requestedBy: data.user._id,
      review: '',
      status: 'Submitted',
      user: '',
      workCompClass: ''
    };
  };

  // handlers
  const submitHandler = async (e) => {
    e.preventDefault();

    const insert = JSON.parse(JSON.stringify($routeStates[$page.url.pathname]));
    insert.change.after = +insert.change.after.toString().replace(/(\$|\,)/g, '');
    insert.change.previous = +insert.change.previous.toString().replace(/(\$|\,)/g, '');
    insert.change.percent = +insert.change.percent.toString().replace(/(\%|\,)/g, '');

    const formData = new FormData();
    formData.append('collection', 'pay-change-requests');

    if (data?._id) {
      formData.append('query', JSON.stringify({ _id: data._id }));
      formData.append('update', JSON.stringify({ $set: insert }));
    }
    if (!data?._id) formData.append('insert', JSON.stringify(insert));

    const response = await fetch(`/api/db?/${data?._id ? 'update' : 'create'}`, {
      body: formData,
      method: 'POST'
    });

    const {
      data: { doc }
    } = await response.json();
    socketio.emit(`db.${data?._id ? 'update' : 'create'}.doc`, {
      collection: 'pay-change-requests',
      doc
    });
    formReset();
    if (data?._id !== undefined && browser) return window.history.back();
  };
  const userChangeHandler = () => {
    const user = $collections.users.find(
      ({ _id }) => _id === $routeStates[$page.url.pathname].user
    );
    $routeStates[$page.url.pathname].previous =
      [...$collections['pay-change-requests']]
        .filter(({ user }) => user === $routeStates[$page.url.pathname].user)
        .sort((a, b) =>
          a.change.date < b.change.date ? 1 : a.change.date > b.change.date ? -1 : 0
        )[0]?.change || {};
    $routeStates[$page.url.pathname].change.previous =
      user?.exempt === $routeStates[$page.url.pathname].previous?.exempt
        ? format.currency($routeStates[$page.url.pathname].previous.after || 0)
        : user?.exempt
        ? format.currency($routeStates[$page.url.pathname].previous.after * 40 * 52 || 0)
        : format.currency($routeStates[$page.url.pathname].previous.after / (40 * 52) || 0) || 0;
    $routeStates[$page.url.pathname].change.after =
      $routeStates[$page.url.pathname].change.previous;
    $routeStates[$page.url.pathname].change.percent = format.percent(0);
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
  let reviewOptions = [];
  let userOptions = [];

  // props (external)
  export let data;
  export let title = 'PCR - Submit';
  export let userFilterFn = ({ department, user }) =>
    user._id !== data.user._id && user.department === department._id;

  // props (dynamic)
  $: if ($routeStates?.[$page.url.pathname] === undefined) formReset();
  $: if ($collections['pay-change-requests'] && data?._id) {
    const doc = [...$collections['pay-change-requests']].find(({ _id }) => _id === data._id);
    $routeStates[$page.url.pathname] = doc;
    $routeStates[$page.url.pathname].change.after = format.currency(
      +$routeStates[$page.url.pathname].change.after.toString().replace(/(\$|\,)/g, '')
    );
    $routeStates[$page.url.pathname].change.previous = format.currency(
      +$routeStates[$page.url.pathname].change.previous.toString().replace(/(\$|\,)/g, '')
    );
    $routeStates[$page.url.pathname].change.percent = format.percent(
      +$routeStates[$page.url.pathname].change.percent.toString().replace(/(\%|\,)/g, '') / 100
    );
  }
  $: if ($collections.users && $routeStates?.[$page.url.pathname]?.user) {
    const user =
      $collections.users.find(({ _id }) => _id === $routeStates[$page.url.pathname]?.user) || {};
    const jobTitle = $collections['job-titles'].find(({ _id }) => _id === user?.jobTitle) || {};
    $routeStates[$page.url.pathname].change.exempt = user?.exempt;
    $routeStates[$page.url.pathname].costCenter = jobTitle?.costCenter || '';
    $routeStates[$page.url.pathname].eeoClassification = jobTitle?.eeoClassification || '';
    $routeStates[$page.url.pathname].jobCode = jobTitle?.jobCode || '';
    $routeStates[$page.url.pathname].jobTitle = jobTitle?.jobTitle || '';
    $routeStates[$page.url.pathname].workCompClass = jobTitle?.workCompClass || '';
  }
  $: if ($collections['employee-reviews'] && $routeStates?.[$page.url.pathname] !== undefined) {
    reviewOptions =
      $routeStates?.[$page.url.pathname]?.user === ''
        ? []
        : [...$collections['employee-reviews']]
            .filter(({ date, user }) => {
              const dateDiff = new Date() - new Date(date);
              if (dateDiff > 1000 * 60 * 60 * 24 * 365) return false;
              if (user !== $routeStates[$page.url.pathname]?.user) return false;
              return true;
            })
            .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
            .map(({ _id, date }) => {
              date = [
                new Date(date).getMonth() + 1,
                new Date(date).getDate() + 1,
                new Date(date).getFullYear()
              ].join('/');
              return { label: date, value: _id };
            });
    if (reviewOptions.length < 1) $routeStates[$page.url.pathname].review = '';
    if (reviewOptions.length === 1)
      $routeStates[$page.url.pathname].review = reviewOptions[0].value;
  }
  $: if ($collections.users && $routeStates?.[$page.url.pathname] !== undefined) {
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
  $: formDisabled =
    $routeStates?.[$page.url.pathname].review === '' ||
    $routeStates?.[$page.url.pathname].change.date === '' ||
    $routeStates?.[$page.url.pathname].change.code === '' ||
    $routeStates?.[$page.url.pathname].change.description === '' ||
    $routeStates?.[$page.url.pathname].change.explanation === ''
      ? true
      : undefined;
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
        bind:value={$routeStates[$page.url.pathname].user}
        class="lg:self-start"
        on:change={userChangeHandler}
        options={userOptions}
      />
    </Fieldset>
    {#if $routeStates[$page.url.pathname]?.user !== ''}
      <Fieldset legend="Review">
        {#if reviewOptions.length === 0}
          <A
            class="{$theme.button} before:hidden lg:self-start"
            href={`/employee-review/${
              $page.url.pathname === '/pcr/submit' ? 'submit' : 'submit-admin'
            }?_id=${$routeStates[$page.url.pathname].user}&redirect=${encodeURIComponent(
              $page.url.pathname === '/pcr/submit' ? '/pcr/submit' : '/pcr/submit-admin'
            )}`}
          >
            Submit
          </A>
        {:else}
          <Select
            bind:value={$routeStates[$page.url.pathname].review}
            class="lg:self-start"
            options={reviewOptions}
          />
        {/if}
      </Fieldset>
      {#if $routeStates[$page.url.pathname].review !== ''}
        <div class="flex flex-col space-y-[2rem] lg:flex-row lg:space-y-0 lg:space-x-[2rem]">
          <div class="flex flex-col space-y-[1rem] lg:items-start lg:flex-grow">
            <div class="font-bold">Last Change</div>
            <Fieldset legend="Effective Date">
              <Input
                disabled={true}
                readonly={true}
                type="date"
                value={$routeStates[$page.url.pathname].previous?.date}
              />
            </Fieldset>
            <div class="flex flex-col space-y-[1rem] lg:flex-row lg:space-y-0 lg:space-x-[1rem]">
              <Fieldset
                legend={`Previous (${
                  $routeStates[$page.url.pathname].previous?.exempt ? 'Annually' : 'Hourly'
                })`}
              >
                <Input
                  class="text-right lg:w-[8rem]"
                  disabled={true}
                  readonly={true}
                  value={format.currency($routeStates[$page.url.pathname].previous?.previous)}
                />
              </Fieldset>
              <Fieldset
                legend={`After (${
                  $routeStates[$page.url.pathname].previous?.exempt ? 'Annually' : 'Hourly'
                })`}
              >
                <Input
                  class="text-right lg:w-[8rem]"
                  disabled={true}
                  readonly={true}
                  value={format.currency($routeStates[$page.url.pathname].previous?.after)}
                />
              </Fieldset>
              <Fieldset legend="Percent">
                <Input
                  class="text-right lg:w-[6rem]"
                  disabled={true}
                  readonly={true}
                  value={format.percent(
                    $routeStates[$page.url.pathname].previous?.after /
                      $routeStates[$page.url.pathname].previous?.previous -
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
                  value={$routeStates[$page.url.pathname].previous?.code}
                />
              </Fieldset>
              <Fieldset legend="Description">
                <Select
                  disabled={true}
                  options={descriptionOptions}
                  readonly={true}
                  value={$routeStates[$page.url.pathname].previous?.description}
                />
              </Fieldset>
            </div>
            <Fieldset class="w-full" legend="Explanation">
              <Textarea
                disabled={true}
                readonly={true}
                value={$routeStates[$page.url.pathname].previous?.explanation}
              />
            </Fieldset>
          </div>
          <div class="flex flex-col space-y-[1rem] lg:items-start lg:flex-grow">
            <div class="font-bold">New Change</div>
            <Fieldset legend="Effective Date">
              <Input type="date" value={$routeStates[$page.url.pathname].change.date} />
            </Fieldset>
            <div class="flex flex-col space-y-[1rem] lg:flex-row lg:space-y-0 lg:space-x-[1rem]">
              <Fieldset
                legend={`Previous (${
                  $routeStates[$page.url.pathname].change?.exempt ? 'Annually' : 'Hourly'
                })`}
              >
                <Input
                  class="text-right lg:w-[8rem]"
                  disabled={true}
                  readonly={true}
                  value={$routeStates[$page.url.pathname].change.previous}
                />
              </Fieldset>
              <Fieldset
                legend={`After (${
                  $routeStates[$page.url.pathname].change?.exempt ? 'Annually' : 'Hourly'
                })`}
              >
                <Input
                  bind:value={$routeStates[$page.url.pathname].change.after}
                  class="text-right lg:w-[8rem]"
                  on:blur={() => {
                    $routeStates[$page.url.pathname].change.after = format.currency(
                      +$routeStates[$page.url.pathname].change.after.replace(/(\$|\,)/g, '')
                    );
                  }}
                  on:keyup={() => {
                    $routeStates[$page.url.pathname].change.percent = format.percent(
                      +$routeStates[$page.url.pathname].change.after.replace(/(\$|\,)/g, '') /
                        +$routeStates[$page.url.pathname].change.previous
                          .toString()
                          .replace(/(\$|\,)/g, '') -
                        1
                    );
                  }}
                />
              </Fieldset>
              <Fieldset legend="Percent">
                <Input
                  bind:value={$routeStates[$page.url.pathname].change.percent}
                  class="text-right lg:w-[6rem]"
                  on:blur={() => {
                    $routeStates[$page.url.pathname].change.percent = format.percent(
                      +$routeStates[$page.url.pathname].change.percent.replace(/(\%|\,)/g, '') / 100
                    );
                  }}
                  on:keyup={() => {
                    $routeStates[$page.url.pathname].change.after = format.currency(
                      +$routeStates[$page.url.pathname].change.previous
                        .toString()
                        .replace(/(\$|\,)/g, '') *
                        (1 +
                          +$routeStates[$page.url.pathname].change.percent.replace(/\%/g, '') / 100)
                    );
                  }}
                />
              </Fieldset>
            </div>
            <div class="flex flex-col space-y-[1rem] lg:flex-row lg:space-y-0 lg:space-x-[1rem]">
              <Fieldset legend="Code">
                <Select
                  bind:value={$routeStates[$page.url.pathname].change.code}
                  class="text-right"
                  on:change={() => {
                    $routeStates[$page.url.pathname].change.description =
                      codesAndDescriptions[$routeStates[$page.url.pathname].change.code];
                  }}
                  options={codeOptions}
                />
              </Fieldset>
              <Fieldset legend="Description">
                <Select
                  bind:value={$routeStates[$page.url.pathname].change.description}
                  on:change={() => {
                    $routeStates[$page.url.pathname].change.code = Object.keys(
                      codesAndDescriptions
                    ).find(
                      (key) =>
                        codesAndDescriptions[key] ===
                        $routeStates[$page.url.pathname].change.description
                    );
                  }}
                  options={descriptionOptions}
                />
              </Fieldset>
            </div>
            <Fieldset class="w-full" legend="Explanation">
              <Textarea bind:value={$routeStates[$page.url.pathname].change.explanation} />
            </Fieldset>
          </div>
        </div>
        <Button class="self-end" disabled={formDisabled} type="submit"
          >{data?._id ? 'Update' : 'Submit'}</Button
        >
      {/if}
    {/if}
  </Form>
</div>
