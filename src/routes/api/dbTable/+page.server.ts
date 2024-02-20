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
	},
	update: async ({ request }) => {
		try {
			let { id, key, model, type, value } = convert(await request.formData()).formData.to.Object();
			const data: { [key: string]: any } = {};
			data[key] = JSON.parse(value);
			if (type === 'int') data[key] = parseInt(value.replace(/\"/g, ''));
			await prisma[model].update({
				where: {
					id
				},
				data
			});
			return { success: true };
		} catch (error) {
			console.log(error);
		}
	}
};
