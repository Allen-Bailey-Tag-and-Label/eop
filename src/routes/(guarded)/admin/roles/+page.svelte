<script>
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
  import { postFetch } from '$lib/helpers';
  import { sanitizeColumns, sanitizeRow } from '$lib/mongoTable';
  import { theme } from '$stores';
  import store from './store';

  // utilities

  // handlers
  const checkboxRouteClickHandler = async (e, i) => {
    const checked = e.target.checked;
    const key = $store.columns[i].value;
    $store.rows = $store.rows.map((row) => {
      row[key] = checked;
      return row;
    });
    await Promise.all(
      $store.rows.map(async (row) => {
        const routes = Object.values($store.columns)
          .map(({ value }) => (row[value] === true ? value : false))
          .filter((route) => route);
        const query = { _id: row._id };
        const update = { $set: { routes } };
        await updateRole({ query, update });
      })
    );
  };
  const checkboxSelectClickHandler = (e) => {
    $store.rows = [...$store.rows].map((row) => {
      row._mongoTable.selected = e.target.checked;
      return row;
    });
  };
  const updateRole = async ({ query, update }) => {
    const response = await postFetch({
      body: { collection, query, update },
      url: '/api/db/update'
    });
  };

  // props (internal)
  let collection = 'roles';

  // props (external)
  export let data;
  export let errors;

  // props (dynamic)
  $: if (data?.routes !== undefined && $store.rows.length === 0) {
    $store.columns = data.routes.map((role) => {
      return { group: role?.group, name: role.name, value: role._id };
    });
    [$store.insertColumns] = sanitizeColumns($store.insertColumns);
    $store.rows = data.roles.map((role) => {
      role = sanitizeRow(role);
      $store.columns.map((column) => {
        role[column.value] = role.routes.includes(column.value);
      });
      return role;
    });
  }
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">Admin - Roles</svelte:fragment>
    <svelte:fragment slot="right">
      <MongoButtonRemove bind:rows={$store.rows} {collection} />
      <MongoButtonCreate bind:rows={$store.rows} {collection} columns={$store.insertColumns} />
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
        {#each $store.columns as { group, name }, i}
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
        {#each $store.rows as row}
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
                  $store.columns.map(({ value }) => (row[value] = e.target.checked));
                  const routes = Object.values($store.columns)
                    .map(({ value }) => (row[value] === true ? value : false))
                    .filter((route) => route);
                  const query = { _id: row._id };
                  const update = { $set: { routes } };
                  updateRole({ query, update });
                }}
              />
            </Td>
            {#each $store.columns as column}
              <Td>
                {#if row?.[column.value] !== undefined}
                  <Checkbox
                    bind:checked={row[column.value]}
                    class="mx-auto"
                    on:change={(e) => {
                      row[column.value] = e.target.checked;
                      const routes = Object.values($store.columns)
                        .map(({ value }) => (row[value] === true ? value : false))
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
