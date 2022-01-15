<script>
  // imports
  import { onMount } from 'svelte';
  import { Icon, Trash } from 'svelte-hero-icons';
  import { twMerge } from 'tailwind-merge';
  import { Button, Offscreen } from '$components';

  // utilities

  // handlers
  const clickHandler = () => show = !show;
  const submitHandler = async () => {
    // check if form hasn't been submitted
    if (!submitted) {
      // update
      submitted = true;

      // get data
      const filter = [...selectedRows];

      try {
        // check if on exists
        if ( 'remove' in on ) await on.remove(filter);

        // close offscren
        show = false
      } catch (message) {
        error = message
      }

      // update submitted
      submitted = false;
    }
  }

  // props (internal)
  const defaultClasses = 'relative';
  let error = '';
  let show = false;
  let submitted = false;

  // props (external)
  export let deleteMessageGenerator = selectedRows => `Are you sure you want to delete ${selectedRows.length} item${selectedRows.length === 1 ? '' : 's'}?`;
  export let on = {}
  export let rows = [];

  // props (dynamic)
  $: classes = twMerge(defaultClasses, '', $$props.class);
  $: selectedRows = [...rows].filter(({dataTableCheckbox})=>dataTableCheckbox?.checked);
  $: message = deleteMessageGenerator(selectedRows);

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

{#if selectedRows.length > 0}
  <div
    class={classes}
  >
    <Button
      on:click={clickHandler}
      theme='error'
      type='icon'
    >
      <Icon src={Trash} class='w-[1.25rem] h-[1.25rem]' />
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
      <div>{message}</div>
      <div class="text-red-500">{error}</div>
      <Button type="submit">Delete</Button>
    </form>

  </Offscreen>
{/if}
<slot/>