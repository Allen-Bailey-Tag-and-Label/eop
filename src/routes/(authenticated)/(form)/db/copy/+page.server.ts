import { DATABASE_URL } from '$env/static/private';
import { PrismaClient } from '@prisma/client';

const replaceDatabase = (replacement: string) =>
	DATABASE_URL.replace(/\.net\/.+\?/, () => `.net/${replacement}?`);

export const actions = {
	default: async ({ request }) => {
		const { databaseFrom, databaseTo, modelName } = <Record<string, string>>(
			Object.fromEntries(await request.formData())
		);
		const urlFrom = replaceDatabase(databaseFrom);
		const urlTo = replaceDatabase(databaseTo);

		const prismaFrom = new PrismaClient({ datasources: { db: { url: urlFrom } } });
		const prismaTo = new PrismaClient({ datasources: { db: { url: urlTo } } });

		// @ts-ignore
		const fromRows = await prismaFrom[modelName].findMany();

		// @ts-ignore
		await prismaTo[modelName].deleteMany();

		// @ts-ignore
		await prismaTo[modelName].createMany({ data: fromRows });

		return { success: true };
	}
};
