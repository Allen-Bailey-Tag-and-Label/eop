<script>
  import { page } from '$app/stores';
  import {
    Checkbox,
    MongoButtonRemove,
    MongoButtonCreate,
    Table,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    TitleBar
  } from '$components';
  import { sanitizeColumns, sanitizeRow } from '$lib/mongoTable';
  import { clientConnection as socketio } from '$lib/socketio';
  import { collections, routeStates, theme } from '$stores';

  // utilities

  // handlers
  const checkboxRouteClickHandler = async (e, i) => {
    const checked = e.target.checked;
    const key = $routeStates[$page.url.pathname].columns[i].value;
    $routeStates[$page.url.pathname].rows = $routeStates[$page.url.pathname].rows.map((row) => {
      row[key] = checked;
      return row;
    });
    await Promise.all(
      $routeStates[$page.url.pathname].rows.map(async (row) => {
        const routes = Object.values($routeStates[$page.url.pathname].columns)
          .map(({ value }) => (row[value] === true ? value : false))
          .filter((route) => route);
        const query = { _id: row._id };
        const update = { $set: { routes } };
        await updateRole({ query, update });
      })
    );
  };
  const checkboxSelectClickHandler = (e) => {
    $routeStates[$page.url.pathname].rows = [...$routeStates[$page.url.pathname].rows].map(
      (row) => {
        row._mongoTable.selected = e.target.checked;
        return row;
      }
    );
  };
  const updateRole = async ({ query, update }) => {
    const formData = new FormData();
    formData.append('collection', collection);
    formData.append('query', JSON.stringify(query));
    formData.append('update', JSON.stringify(update));
    const response = await fetch('/api/db?/update', {
      body: formData,
      method: 'POST'
    });
    const {
      data: { doc }
    } = await response.json();
    socketio.emit('db.update.doc', { collection, doc });
  };

  // props (internal)
  let collection = 'roles';
  const [insertColumns] = sanitizeColumns(['name', { type: 'hidden', key: 'routes', value: [] }]);

  if ($routeStates?.[$page.url.pathname] === undefined) {
    $routeStates[$page.url.pathname] = {
      columns: [],
      rows: [],
      sort: {
        direction: 1,
        key: 'group'
      }
    };
  }

  // props (dynamic)
  $: if ($collections.routes) {
    $routeStates[$page.url.pathname].columns = $collections.routes
      .sort((a, b) =>
        a.group < b.group
          ? -1
          : a.group > b.group
          ? 1
          : a.name < b.name
          ? -1
          : a.name > b.name
          ? 1
          : 0
      )
      .map((role) => {
        return { group: role?.group, name: role.name, value: role._id };
      });
  }
  $: if ($collections.roles) {
    $routeStates[$page.url.pathname].rows = $collections.roles
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      .map((role) => {
        role = sanitizeRow(role);
        $routeStates[$page.url.pathname].columns.map((column) => {
          role[column.value] = role.routes.includes(column.value);
        });
        return role;
      });
  }

  $: console.log(insertColumns);
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">Admin - Roles</svelte:fragment>
    <svelte:fragment slot="right">
      <MongoButtonRemove bind:rows={$routeStates[$page.url.pathname].rows} {collection} />
      <MongoButtonCreate
        bind:rows={$routeStates[$page.url.pathname].rows}
        {collection}
        columns={insertColumns}
      />
    </svelte:fragment>
  </TitleBar>
  <div class="flex flex-grow overflow-y-auto p-[2rem] pt-0 mt-[2rem]">
    <Table>
      <Thead>
        <Th>
          <div class="flex flex-col items-center">
            <div>Select</div>
            <Checkbox on:click={checkboxSelectClickHandler} />
          </div>
        </Th>
        <Th>Role</Th>
        <Th>
          <div class="flex flex-col items-center">
            <div>All</div>
          </div>
        </Th>
        {#each $routeStates[$page.url.pathname].columns as { group, name }, i}
          <Th>
            <div class="flex flex-col items-center">
              <div>{group}</div>
              <div>{name}</div>
              <Checkbox
                on:click={(e) => {
                  checkboxRouteClickHandler(e, i);
                }}
              />
            </div>
          </Th>
        {/each}
      </Thead>
      <Tbody>
        {#each $routeStates[$page.url.pathname].rows as row, i}
          <Tr>
            <Td class="w-[32px]">
              {#if row?._mongoTable?.selected !== undefined}
                <Checkbox bind:checked={row._mongoTable.selected} class="mx-auto" />
              {/if}
            </Td>
            <td
              bind:innerHTML={row.name}
              class={$theme.td}
              contenteditable="true"
              on:blur={() => {
                const query = { _id: row._id };
                const update = { $set: { name: row.name } };
                updateRole({ query, update });
              }}
            />
            <Td>
              <Checkbox
                on:click={(e) => {
                  $routeStates[$page.url.pathname].columns.map(
                    ({ value }) =>
                      ($routeStates[$page.url.pathname].rows[i][value] = e.target.checked)
                  );
                  const routes = Object.values($routeStates[$page.url.pathname].columns)
                    .map(({ value }) =>
                      $routeStates[$page.url.pathname].rows[i][value] === true ? value : false
                    )
                    .filter((route) => route);
                  const query = { _id: row._id };
                  const update = { $set: { routes } };
                  updateRole({ query, update });
                }}
              />
            </Td>
            {#each $routeStates[$page.url.pathname].columns as column}
              <Td>
                {#if row?.[column.value] !== undefined}
                  <Checkbox
                    bind:checked={$routeStates[$page.url.pathname].rows[i][column.value]}
                    class="mx-auto"
                    on:click={(e) => {
                      $routeStates[$page.url.pathname].rows[i][column.value] = e.target.checked;
                      const routes = Object.values($routeStates[$page.url.pathname].columns)
                        .map(({ value }) =>
                          $routeStates[$page.url.pathname].rows[i][value] === true ? value : false
                        )
                        .filter((route) => route);
                      const query = { _id: row._id };
                      const update = { $set: { routes } };
                      updateRole({ query, update });
                    }}
                  />
                {/if}
              </Td>
            {/each}
          </Tr>
        {/each}
      </Tbody>
    </Table>
  </div>
</div>
