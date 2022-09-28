<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { Header, Main } from '$components';
  import { clientConnection as socketio } from '$lib/socketio';
  import { collections } from '$stores';

  // utilities

  // handlers

  // props (internal)

  // props (external)
  export let data;

  // props (dynamic)
  $: if (browser && data?.status === 401) goto('/signin');
  $: user = data?.user;
  $: routes =
    user === undefined || $collections?.roles === undefined || $collections?.routes === undefined
      ? []
      : user.roles.reduce((arr, _roleId) => {
          // find role
          const role = $collections.roles.find(
            (currentRole) => currentRole._id.toString() === _roleId.toString()
          );

          // loop through role routes
          role.routes.map((_routeId) => {
            // find route
            const route = $collections.routes.find(
              (currentRoute) => currentRoute._id.toString() === _routeId.toString()
            );

            if (route === undefined) return;

            // initiate group
            const title = route?.group ? route.group : '';

            // find group index
            let groupIndex = arr.findIndex((obj) => obj.title === title);

            // check if group is undefined
            if (groupIndex === -1) {
              arr.push({ title, items: [] });
              groupIndex = arr.length - 1;
            }

            // check if group doesn't have route
            if (!arr[groupIndex].items.find((item) => item._id.toString() === route._id.toString()))
              arr[groupIndex].items.push({
                _id: route._id,
                href: route.href,
                innerHTML: route.name
              });
          });
          return arr;
        }, []);

  // lifecycle
  onMount(() => ($collections = data?.collections || {}));

  // socketio listeners
  socketio.on('db.create.doc', ({ collection, doc }) => {
    $collections[collection] = [...$collections[collection], doc];
  });
  socketio.on('db.remove.doc', ({ collection, doc }) => {
    $collections[collection] = [...$collections[collection]].filter(({ _id }) => _id !== doc._id);
  });
  socketio.on('db.update.doc', ({ collection, doc }) => {
    $collections[collection] = [...$collections[collection]].map((storeDoc) =>
      doc._id === storeDoc._id ? doc : storeDoc
    );
  });
</script>

<Main>
  <div class="flex flex-col flex-grow overflow-hidden">
    <slot />
  </div>
  <Header {routes} />
</Main>
