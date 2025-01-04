import { prisma } from '$lib/prisma';
import { type Actions } from '@sveltejs/kit';
import type { ActionParams, Field } from './types';
import { DateTime } from 'luxon';

type Params = {
	actions?: Map<
		string,
		({ request }: ActionParams) => Promise<{
			success: boolean;
		}>
	>;
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

const createLog = async ({
	data,
	model,
	route,
	userId,
	type
}: {
	data: string;
	model: string;
	route: string;
	userId: string;
	type: string;
}) => {
	await prisma.log.create({
		data: {
			data,
			model,
			route,
			userId,
			type
		}
	});
};

export const getActions = ({
	actions,
	fields,
	fieldsRequiringRelation,
	modelName
}: Params): Actions => {
	const defaultActions = new Map([
		[
			'create',
			async ({
				locals: {
					user: { id: userId }
				},
				request,
				route: { id: route }
			}: ActionParams) => {
				const formData = <Record<string, any>>Object.fromEntries(await request.formData());
				const data = fields.reduce(
					(data: Record<string, any>, { isId, isList, isRequired, name, type }: Field) => {
						if (['createdAt', 'createdById', 'updatedAt'].includes(name)) return data;
						if (!isId) {
							if (type === 'Boolean') data[name] = formData[name] === 'true' || false;
							if (type === 'DateTime')
								data[name] = DateTime.fromFormat(
									formData[name] || DateTime.fromJSDate(new Date(0)).toFormat('yyyy-MM-dd'),
									'yyyy-MM-dd'
								).toJSDate();
							if (type === 'Int') data[name] = +formData[name] || 0;
							if (type === 'String') {
								data[name] = formData[name] || '';
							}
							if (isList && data[name] !== undefined)
								data[name] = data[name] === '' ? [] : [data[name]];
						}
						if (data[name] === '' && !isRequired) delete data[name];
						return data;
					},
					{ createdById: userId }
				);
				await Promise.all([
					// @ts-ignore
					prisma[modelName].create({
						data
					}),
					createLog({
						data: JSON.stringify(data),
						model: modelName,
						route: route || '',
						userId,
						type: 'create'
					})
				]);
				return { success: true };
			}
		],
		[
			'delete',
			async ({
				locals: {
					user: { id: userId }
				},
				request,
				route: { id: route }
			}: ActionParams) => {
				const { ids } = <{ ids: string }>Object.fromEntries(await request.formData());
				const where = {
					id: {
						in: JSON.parse(ids)
					}
				};
				await Promise.all([
					// @ts-ignore
					prisma[modelName].deleteMany({
						where
					}),
					createLog({
						data: JSON.stringify(where),
						model: modelName,
						route: route || '',
						userId,
						type: 'delete'
					})
				]);
				return { success: true };
			}
		],
		[
			'save',
			async ({
				locals: {
					user: { id: userId }
				},
				request,
				route: { id: route }
			}: ActionParams) => {
				const { updates } = <{ updates: string }>Object.fromEntries(await request.formData());
				console.log(JSON.parse(updates)[0].roles);
				await Promise.all([
					prisma.$transaction(
						JSON.parse(updates).map(
							({
								createdAt,
								id,
								updatedAt,
								...data
							}: {
								createdAt: Date;
								id: string;
								updatedAt: Date;
								data: Record<any, any>;
							}) => {
								// @ts-ignore
								return prisma[modelName].update({ where: { id }, data });
							}
						)
					),
					prisma.$transaction(
						JSON.parse(updates).map(({ id, ...data }: { id: string; data: Record<any, any> }) => {
							return prisma.log.create({
								data: {
									data: JSON.stringify(data),
									model: modelName,
									route: route || '',
									userId,
									type: 'update'
								}
							});
						})
					)
				]);
				return { success: true };
			}
		],
		[
			'update',
			async () => {
				return { success: true };
			}
		]
	]);
	if (actions === undefined) actions = new Map();
	const mergedActions = new Map([...defaultActions, ...actions]);
	return [...mergedActions].reduce((object: Actions, [key, action]) => {
		object[key] = action;
		return object;
	}, {});
};
