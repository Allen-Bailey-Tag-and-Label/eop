import connect from '$db';

export async function load() {
  // connect to db
  const client = await connect();

  // get routes
  const routes = await client.db().collection('routes').find().toArray();
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
