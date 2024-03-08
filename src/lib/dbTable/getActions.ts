import { prisma } from '$lib/prisma/index.js';
import { convert } from '$utilities';
import type { Actions } from '@sveltejs/kit';
import type { ModelName } from './types';

export const getActions = () => {
	const actions: Actions = {
		create: async ({ request }) => {
			try {
				const { values, model }: { values: any; model: ModelName } = convert(
					await request.formData()
				).formData.to.Object();
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
				let { id, key, model, type, value } = convert(
					await request.formData()
				).formData.to.Object();
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
		},
		upload: async ({ request }) => {
			try {
				let { model, uploadRows } = convert(await request.formData()).formData.to.Object();
				uploadRows = JSON.parse(uploadRows);
				uploadRows = uploadRows.map((row: any) => {
					delete row._dataTable;
					return row;
				});
				await prisma[model].createMany({
					data: uploadRows
				});
				return { success: true };
			} catch (error) {
				console.log(error);
			}
		}
	};
	return actions;
};
