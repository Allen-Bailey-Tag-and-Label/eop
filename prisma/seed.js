import { prisma } from '../src/lib/prisma/index.js';
import data from './backups/backup.json' assert { type: 'json' };

const models = {
	faq: 0,
	jobTitle: 1,
	payChangeRequest: 2,
	profile: 3,
	role: 4,
	route: 5,
	upsQuote: 6,
	user: 7
};

await Promise.all(
	Object.keys(models).map(async (model) => {
		// await prisma[model].deleteMany();
		await Promise.all(
			data[models[model]].map(async (row) => {
				try {
					await prisma[model].create({ data: row });
				} catch (error) {
					console.log(model, row);
				}
			})
		);
	})
);
