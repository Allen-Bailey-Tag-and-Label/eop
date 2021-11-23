import { serverFetch } from '$lib/_helpers'
import { getSelf } from '$lib/user';

  export default async (_id=undefined) => {
  // get self if _id is undefined
  if ( _id === undefined) {
    const user = await getSelf();
    _id = user._id;
  }

  // get all user PTO requests
  const { rows } = await serverFetch(`/api/datatable/pto-requests?userId=${_id}&sort=${JSON.stringify({start:1})}`);

  return rows;
}