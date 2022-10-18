import 'dotenv/config';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import db from '$db';

export async function POST({ request }) {
  // destructure request.formData
  const { db: dbName, date } = Object.fromEntries(await request.formData());

  // initialize connection to db
  const client = await db.connect({ db: dbName });

  // readfile
  const rawData = await readFile(resolve(process.env.DB_BACKUP_DIR, dbName, `${date}.json`));
  const contents = JSON.parse(rawData);

  // loop through collections
  await Promise.all(
    Object.keys(contents).map(async (collection) => {
      // delete collection docs
      await client.db().collection(collection).deleteMany();

      // get backup docs
      const docs = contents[collection];

      // insert backup docs
      await client.db().collection(collection).insertMany(docs);
    })
  );

  return new Response();
}
