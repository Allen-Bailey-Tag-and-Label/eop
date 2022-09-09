import db from '$db';

export async function load() {
  // get routes
  const users = await db.find({ collection: 'users' });

  return {
    users: JSON.parse(JSON.stringify(users))
  };
}
