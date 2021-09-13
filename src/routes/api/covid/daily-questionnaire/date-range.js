import { connect } from '$lib/db';
import authenticateUser from '../../auth/get/_userId';

export async function get({ query }) {
  // connect to db
  const client = await connect();

  // sanitize query
  query = Object.fromEntries(query);

  // format from and to
  query.date = { 
    $gte : +query.from,
    $lte : +query.to
  }
  delete query.from;
  delete query.to;
  
  // check for auth
  if ('auth' in query) query = await authenticateUser(query);

  // find rows
  let rows = await client
    .db()
    .collection('covid-daily-questionnaire')
    .find(query)
    .toArray();

  return {
    status: 200,
    body: {
      rows
    }
  }
}