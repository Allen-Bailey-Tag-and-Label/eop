import db from '$db';

export async function load() {
  // get routes
  const [roles, routes] = await Promise.all([
    db.find({ collection: 'roles' }),
    db.find({ collection: 'routes' })
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
