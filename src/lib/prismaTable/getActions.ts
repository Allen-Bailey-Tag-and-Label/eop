import { type Actions } from '@sveltejs/kit';
import { DateTime } from 'luxon';
import { prisma } from '$lib/prisma';
import type { ActionParams, Field, PageServer } from './types';

type Params = Pick<PageServer, 'actions' | 'modelName'> & {
	fields: Field[];
	fieldsRequiringRelation: Map<
		string,
		{
			key: string;
			model: string;
		}
	>;
};

const createLog = ({
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
}) =>
	prisma.log.create({
		data: {
			createdBy: { connect: { id: userId } },
			data,
			model,
			route,
			type
		}
	});

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
				const data = Object.keys(formData).reduce(
					(data: Record<string, any>, key: string) => {
						const field = fields.find(({ name }) => name === key);
						if (field === undefined) return data;
						const { isList, name, type } = field;
						if (type === 'Boolean') data[name] = formData[name] === 'on' || false;
						if (type === 'DateTime')
							data[name] = DateTime.fromFormat(
								formData[name] ||
									DateTime.fromJSDate(new Date(0), {
										zone: 'America/New_York'
									}).toFormat('yyyy-MM-dd'),
								'yyyy-MM-dd',
								{
									zone: 'America/New_York'
								}
							).toJSDate();
						if (type === 'Int') data[name] = +formData[name] || 0;
						if (type === 'String') {
							data[name] = formData[name] || '';
						}
						if (isList && data[name] !== undefined)
							data[name] = data[name] === '' ? [] : [data[name]];
						return data;
					},
					Object.assign(
						fields
							.filter(
								({ hasDefaultValue, isId, isRequired, name, relationName }) =>
									!['createdAt', 'createdById', 'updatedAt'].includes(name) &&
									!hasDefaultValue &&
									!isId &&
									isRequired &&
									relationName === undefined
							)
							.reduce((data: Record<string, any>, { isList, name, type }) => {
								let isRelational = false;
								let key = name;
								if (fieldsRequiringRelation.has(name)) {
									const { key: relationKey } = fieldsRequiringRelation.get(name) || {};
									if (relationKey) key = relationKey;
									isRelational = true;
								}
								data[key] = '';

								if (type === 'Boolean') data[key] = false;
								if (type === 'DateTime') data[key] = new Date(0);
								if (type === 'Int') data[key] = 0;

								if (isList) data[key] = [];

								if (isRelational) data[key] = {};

								return data;
							}, {}),
						{ createdBy: { connect: { id: userId } } }
					)
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
							return createLog({
								data: JSON.stringify(data),
								model: modelName,
								route: route || '',
								userId,
								type: 'update'
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
