import { prisma } from '$lib/prisma/index.js';
import { convert } from '$utilities';

export const actions = {
	create: async ({ request }) => {
		try {
			const { values, model } = convert(await request.formData()).formData.to.Object();
			const data = JSON.parse(values);
			const row = await prisma[model].create({ data });
			return { success: true, row };
		} catch (error) {
			console.log(error);
		}
	},
	delete: async ({ request }) => {
		try {
			const { ids: idsString, model } = convert(await request.formData()).formData.to.Object();
			const ids = JSON.parse(idsString);
			await prisma[model].deleteMany({
				where: {
					id: {
						in: ids
					}
				}
			});
			return { success: true };
		} catch (error) {
			console.log(error);
		}
	}
};
