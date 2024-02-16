<script lang="ts">
  import { DataTable } from '$components';

  // props (external)
  export let data;

  // props (dynamic)
  $: routeOptions = data.routes.map((route) => {
    return {
      label: [route.group, route.label].filter((s) => s !== '').join(' - '),
      value: route.id
    };
  });
  $: userProfileOptions = data.userProfiles.map((userProfile) => {
    return { label: `${userProfile.firstName} ${userProfile.lastName}`, value: userProfile.id };
  });
  $: columns = [
    { key: 'name', label: 'Name' },
    {
      getInnerHTML: (role) =>
        role.routes
          .map((route) => [route.group, route.label].filter((s) => s !== '').join(' - '))
          .join(' | '),
      getValues: (role) =>
        role.routes.map((route) => [route.group, route.label].filter((s) => s !== '').join(' - ')),
      key: 'routes',
      options: routeOptions,
      type: 'many-to-many'
    },
    {
      getInnerHTML: (role) =>
        role.userProfiles
          .map((userProfile) => `${userProfile.firstName} ${userProfile.lastName}`)
          .join(' | '),
      key: 'userProfiles',
      label: 'Users',
      options: userProfileOptions,
      type: 'many-to-many'
    }
  ];

  $: rows = data.roles;
</script>

<DataTable {columns} {rows} />
