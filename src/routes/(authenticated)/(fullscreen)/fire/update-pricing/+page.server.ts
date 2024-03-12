import { prisma } from '$lib/prisma/index.js';
import { convert } from '$utilities';

export const actions = {
	find: async ({ request }) => {
		const { optionsFindString, type } = convert(await request.formData()).formData.to.Object();
		const options = JSON.parse(optionsFindString);
		const data = await prisma.firePricing.findMany({
			where: { options, type },
			orderBy: [{ quantity: 'asc' }]
		});
		let prismaMethod, rows;
		if (data.length === 0) {
			prismaMethod = 'create';
			rows = [...Array(50)].map((_, i) => {
				const quantity = (i + 1) * 1000;
				const price = 0;
				return { quantity, price };
			});
		}
		if (data.length !== 0) {
			prismaMethod = 'upsert';
			rows = [...data].map((row) => ({ id: row.id, quantity: row.quantity, price: row.price }));
		}
		return { success: true, prismaMethod, rows };
	},
	update: async ({ request }) => {
		const { dataString, optionsString, prismaMethod, type } = convert(
			await request.formData()
		).formData.to.Object();
		const pricingArray = JSON.parse(dataString);
		const options = JSON.parse(optionsString);
		const data = pricingArray.map((obj) => {
			const price = parseFloat(obj.price);
			return { ...obj, options, price, type };
		});
		if (prismaMethod === 'create') {
			await prisma.firePricing.createMany({ data });
		}
		if (prismaMethod === 'upsert') {
			const transactions = data.map(({ id, options, price, quantity, type }) => {
				return prisma.firePricing.update({
					where: {
						id
					},
					data: {
						options,
						price,
						quantity,
						type
					}
				});
			});
			await prisma.$transaction(transactions);
		}
		return { success: true };
	}
};
