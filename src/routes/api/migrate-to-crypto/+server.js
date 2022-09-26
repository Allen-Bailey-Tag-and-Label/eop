import { json } from '@sveltejs/kit';
import db from '$db';

export async function POST({ request }) {
  await db.update({
    collection: 'users',
    update: {
      $unset: { password: '' }
    }
  });
  return json({});
}
