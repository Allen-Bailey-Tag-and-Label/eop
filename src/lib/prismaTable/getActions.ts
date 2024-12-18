import { prisma } from '$lib/prisma';
import type { Actions } from '@sveltejs/kit';

type Params = {
	fields: Field[];
	fieldsRequiringRelation: Map<
		string,
		{
			key: string;
			model: string;
		}
	>;
	modelName: string;
};
type Field = {
	isId: boolean;
	isRequired: boolean;
	name: string;
	type: string;
};

export const getActions = ({ fields, fieldsRequiringRelation, modelName }: Params): Actions => {
	return {
		create: async () => {
			const data = fields.reduce(
				(data: Record<string, any>, { isId, isRequired, name, type }: Field) => {
					if (!isId && isRequired && fieldsRequiringRelation.get(name) === undefined) {
						if (type === 'String') data[name] = '';
					}
					return data;
				},
				{}
			);
			// @ts-ignore
			await prisma[modelName].create({
				data
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
				JSON.parse(updates).map(({ id, ...data }: { id: string; data: Record<any, any> }) => {
					// @ts-ignore
					return prisma[modelName].update({ where: { id }, data });
				})
			);
			return { success: true };
		},
		update: async () => {
			return { success: true };
		}
	};
};
