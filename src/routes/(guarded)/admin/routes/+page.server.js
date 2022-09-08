import db from '$db';

export async function load() {
  // get routes
  const routes = await db.find({ collection: 'routes' });

  return {
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
