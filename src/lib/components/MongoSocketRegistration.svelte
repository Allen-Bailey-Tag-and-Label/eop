<script>
  import { onMount } from 'svelte';
  import { clientConnection as socketio } from '$lib/socketio';
  import { socketio as socketioStore } from '$stores';

  // props (external)
  export let store;

  // lifecycle
  onMount(() => {
    Object.keys(store.data).map((dataCollection) => {
      const events = {
        'db.create': ({ collection, doc }) => {
          if (dataCollection === collection)
            store.data[collection] = [...store.data[collection], doc];
        },
        'db.remove': ({ collection, doc }) => {
          if (dataCollection === collection)
            store.data[collection] = [...store.data[collection]].filter(
              ({ _id }) => _id !== doc._id
            );
        },
        'db.update': ({ collection, doc }) => {
          if (dataCollection === collection)
            store.data[collection] = [...store.data[collection]].map((storeDoc) =>
              doc._id === storeDoc._id ? doc : storeDoc
            );
        }
      };

      Object.keys(events).map((event) => {
        const listener = events[event];
        socketio.on(event, listener);
        socketioStore.register({ event, listener });
      });
    });
  });
</script>
