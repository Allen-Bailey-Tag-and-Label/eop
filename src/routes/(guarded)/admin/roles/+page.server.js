import connect from '$db';

export async function load() {
  // connect to db
  const client = await connect();

  // get routes
  const [roles, routes] = await Promise.all([
    client.db().collection('roles').find().toArray(),
    client.db().collection('routes').find().toArray()
  ]);

  return {
    roles: JSON.parse(
      JSON.stringify(
        roles
          .map((role) => {
            if (role?.routes === undefined) role.routes = [];
            if (role?.safetyItems === undefined) role.safetyItems = [];
            return role;
          })
          .sort((a, b) => {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
          })
      )
    ),
    routes: JSON.parse(
      JSON.stringify(
        routes.sort((a, b) => {
          if (a.group === undefined) return -1;
          if (b.group === undefined) return 1;
          if (a.group < b.group) return -1;
          if (a.group > b.group) return 1;
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        })
      )
    )
  };
}
