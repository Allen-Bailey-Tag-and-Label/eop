<script>
  // imports
  import { onMount } from 'svelte';
  import { Icon, Plus } from 'svelte-hero-icons';
  import { twMerge } from 'tailwind-merge';
  import { Button, Input, Offscreen } from '$components';
  import { camelCaseToSentenceCase } from '$lib/utils';

  // utilities
  const mapColumn = field => {
    field.value = '';
    return field;
  }

  // handlers
  const clickHandler = () => show = !show;
  const submitHandler = async (e) => {
    // check if form hasn't been submitted
    if (!submitted) {
      // update submitted
      submitted = true;

      // get data
      const data = [...fields].reduce((obj, field) => {
        obj[field.key] = field.value;
        return obj;
      }, {})

      try {
        // check if on exists
        if ( 'create' in on ) await on.create(data);

        // reset field values
        fields = [...fields].map(mapColumn);

        // close offscreen
        show = false;
      } catch(message) {
        error = message;
      }

      // update submitted
      submitted = false;
    }
  }

  // props (internal)
  const defaultClasses = 'relative';
  let error = '';
  let fields = [];
  let show = false;
  let submitted = false;

  // props (external)
  export let columns = [];
  export let on = {};

  // props (dynamic)
  $: classes = twMerge(defaultClasses, '', $$props.class);
  $: if (columns.length > 0 && fields.length === 0 ) fields = [...columns].map(mapColumn);

  // lifecycle
  const lifecycle = {
    destroy : () => {},
    mount : async () => {},
  }
  onMount(async() => {
    await lifecycle.mount();
    return () => {
      lifecycle.destroy();
    }
  })
</script>

<div
  class={classes}
>
  <Button
    on:click={clickHandler}
    type='icon'
  >
    <Icon src={Plus} class='w-[1.25rem] h-[1.25rem]' />
  </Button>
</div>

<Offscreen
  bind:show
  direction='right'
>
  <form 
    class="flex flex-col space-y-[2rem] p-[1rem] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary-500 scrollbar-thumb-rounded"
    on:submit|preventDefault={submitHandler}
  >
    <div class="inline-grid grid-cols-[auto_auto] gap-x-[1rem] gap-y-[.5rem] items-center">
      {#each fields as { key, type = 'string', value }}
        <div class=''>{camelCaseToSentenceCase(key)}</div>
        <div class=''>
          {#if type === 'string'}
            <Input
              bind:value
              class='w-full'
              name='key'
            />
          {/if}
        </div>
      {/each}
      <div class="col-span-2 text-red-500">{error}</div>
    </div>
    <Button
      class='col-span-2'
      type="submit"
    >
      Add
    </Button>
  </form>
</Offscreen>
<slot/>