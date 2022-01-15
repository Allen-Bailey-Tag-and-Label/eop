<script>
  // imports
  import { onDestroy, onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import { DataTable } from '$components';
  import * as socketioDataTable from '$lib/socketio/dataTable';
  import { socket, token } from '$stores';

  // utilities
  const create = async data => {
    // initiate body
    const body = {
      collection,
      data,
      token: $token
    };

    try {
      // emit to server
      await new Promise((res, rej) => {
        $socket.emit('create', body, ({ error }) => {
          if (error) return rej(error);
          // if (doc) rows = [...rows, doc];
          res();
        });
      });
    } catch (error) {
      throw error;
    }
  }
  const remove = async filter => {
    // initiate body
    const body = {
      collection,
      query : { $or : [...filter].map(({ _id}) => { return { _id }})},
      token: $token
    }

    try {
      // emit to server
      await new Promise((res, rej) => {
        $socket.emit('remove', body, ({ error }) => {
          if (error) return rej(error);
          res();
        })
      })
    } catch (error) {
      throw error;
    }
  }

  // handlers

  // props (internal)
  const defaultClasses = '';
  const defaultOn = {
    create,
    remove,
  }
  let listeners = [];

  // props (external)
  export let columns = [];
  export let collection = '';
  export let editable = true;
  export let on = {};
  export let rows = [];

  // props (dynamic)
  $: classes = twMerge(defaultClasses, '', $$props.class);
  $: mergedOn = Object.assign(defaultOn, on);

  // lifecycle
  const lifecycle = {
    destroy : async () => socketioDataTable.destroy({ listeners, socket: $socket }),
    mount : async () => {
      ({ listeners } = await socketioDataTable.onMount({
        collection,
        events: {
          create: doc => rows = [...rows, doc],
					find: docs => rows = docs,
					remove: docs => rows = [...rows].filter(({ _id }) => !docs.some(doc => doc._id === _id)),
					update: doc => rows = [...rows].map(row=>row._id === doc._id ? doc._id : row._id)
        },
        socket: $socket,
        token: $token
      }))
    },
  }
  onDestroy(async() => await lifecycle.destroy())
  onMount(async() => await lifecycle.mount())
</script>

<DataTable
  bind:columns
  bind:editable
  bind:on={mergedOn}
  bind:rows
  class={classes}
  {...$$props}
/>
<slot/>