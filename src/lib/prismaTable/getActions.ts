import { prisma } from '$lib/prisma';
import type { Actions } from '@sveltejs/kit';

export const getActions = (modelName: string): Actions => {
	return {
		create: async () => {
			// @ts-ignore
			await prisma[modelName].create({
				data: {
					href: '',
					group: '',
					label: ''
				}
			});
			return { success: true };
		},
		delete: async ({ request }) => {
			const { ids } = <{ ids: string }>Object.fromEntries(await request.formData());
			// @ts-ignore
			await prisma[modelName].deleteMany({
				where: {
					id: {
						in: JSON.parse(ids)
					}
				}
			});
			return { success: true };
		},
		save: async ({ request }) => {
			const { updates } = <{ updates: string }>Object.fromEntries(await request.formData());
			await prisma.$transaction(
				JSON.parse(updates).map(({ id, ...data }: { id: string; data: Record<any, any> }) =>
					// @ts-ignore
					prisma[modelName].update({ where: { id }, data })
				)
			);
			return { success: true };
		},
		update: async ({ request }) => {
			// // @ts-ignore
			// const getRows = <Record<string, any>[]>prisma[modelName].findMany();
			// const rows = await getRows;

			return { success: true };
		}
	};
};
