import 'dotenv/config';
import { readdir, readFile } from 'fs/promises';
import { ObjectId } from 'mongodb';
import { resolve } from 'path';
import db from '$db';

export async function POST({ request }) {
  // initialize dbName & date variables
  let dbName, date;

  try {
    // destructure request.formData
    let { db: dbName, date } = Object.fromEntries(await request?.formData()) || {};
  } catch (error) {}

  // check if no db provided
  if (dbName === undefined) dbName = process.env.MONGODB_DB;

  // check if no date provided
  if (date === undefined) {
    const files = await readdir(resolve(process.env.DB_BACKUP_DIR, dbName));
    date = files.sort((a, b) => (a < b ? 1 : a > b ? 1 : 0))[0].replace(/\.json/g, '');
  }

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
      const docs = contents[collection].map((doc) => {
        doc._id = ObjectId(doc._id);
        return doc;
      });

      // insert backup docs
      await client.db().collection(collection).insertMany(docs);
    })
  );

  return new Response();
}
