import 'dotenv/config';
import { mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';
import db from '$db';

export async function POST({ request }) {
  // destructure request.formData
  const { db: dbName } = Object.fromEntries(await request.formData());

  // initialize connections to dbs
  const clientFrom = await db.connect({ db: dbName });

  // list collections to duplicate
  const collections = [
    'covid-daily-questionnaire',
    'direct-reports',
    'faq',
    'job-titles',
    'pay-change-requests',
    'roles',
    'routes',
    'safety-history',
    'safety-types',
    'ups-quotes',
    'users',
    'vaccine-status'
  ];

  // get current date
  const date = [
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate(),
    new Date().getHours(),
    new Date().getMinutes(),
    new Date().getSeconds()
  ]
    .map((d) => d.toString().padStart(2, '0'))
    .join('');

  // initialize backup
  const backup = {};

  // loop over collections
  await Promise.all(
    collections.map(async (collection) => {
      // get all collection documents
      const docs = await clientFrom.db().collection(collection).find().toArray();
      backup[collection] = docs;
    })
  );

  // create folder if necessary
  await mkdir(resolve(process.env.DB_BACKUP_DIR, dbName), { recursive: true });

  // create backup file
  await writeFile(
    resolve(process.env.DB_BACKUP_DIR, dbName, `${date}.json`),
    JSON.stringify(backup)
  );

  return new Response();
}
