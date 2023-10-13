import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../src/lib/prisma/index.js';

const json = {};
await Promise.all(
	Object.keys(prisma)
		.filter((key) => !key.startsWith('$') && !key.startsWith('_') && key !== 'excelJsModel')
		.map(async (model) => (json[model] = await prisma[model].findMany()))
);

await fs.writeFile(
	path.join(process.cwd(), '/prisma/backups/backup2.json'),
	JSON.stringify(json),
	'utf8'
);
