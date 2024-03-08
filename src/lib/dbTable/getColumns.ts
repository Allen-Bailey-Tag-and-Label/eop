import { Prisma } from '@prisma/client';
import { prisma } from '$lib/prisma';
import { filterFields } from './filterFields';
import { typeMap } from './typeMap';
import type { Column, Error, Include, ModelName, Options } from './types';

export const getColumns = async (modelName: ModelName, options: Options) => {
	const models = Prisma.dmmf.datamodel.models;
	const model = models.find((model) => model.name === modelName);
	if (model === undefined) throw 'Could not find model';
	const fields = model?.fields;
	if (fields === undefined) throw 'Could not find fields';
	const fieldMap = fields.reduce((map, field) => {
		map.set(field.name, field);
		return map;
	}, new Map());
	let errors: Error[] = [];
	const include: Include = {};
	await Promise.all(
		fields
			.filter((field) => !options.filteredColumns.includes(field.name))
			.map(async (field) => {
				const { isList, name, relationName, relationFromFields, relationToFields, type } = field;
				const { getRelationLabel, ...column }: Column = options?.columns?.get(field.name) || {};
				column.key = column.key || name;
				column.label = column.label || name;
				column.type = column.type || typeMap.get(type);
				if (relationName !== undefined) {
					if (getRelationLabel === undefined) {
						errors = [...errors, { key: name, error: 'Missing "getRelationLabel" function' }];
						return;
					}
					const options = (await prisma[type as ModelName].findMany())
						.map((row: any) => ({
							label: getRelationLabel(row),
							value: row.id
						}))
						.sort((a: any, b: any) => a.label.localeCompare(b.label));
					// one-to-one & many-to-may
					if (relationFromFields !== undefined && relationFromFields.length > 0) {
						let relationshipType;
						if (!isList) relationshipType = 'one-to-one';
						if (isList) relationshipType = 'many-to-many';
						const relationshipFieldName = relationFromFields[0];
						const relationshipField = fieldMap.get(relationshipFieldName);
						relationshipField.dbTable = {
							...relationshipField?.dbTable,
							label: name,
							options,
							type: relationshipType
						};
						fieldMap.set(relationshipFieldName, relationshipField);
					}
				}
				fieldMap.set(name, { ...fieldMap.get(name), dbTable: column });
			})
	);
	const columns = Array.from(fieldMap)
		.filter(([_, field]) => {
			return filterFields(field, options);
		})
		.map(([_, field]) => field.dbTable)
		.sort((a, b) => {
			const aIndex = options.columnOrder?.indexOf(a.label) || -1;
			const bIndex = options.columnOrder?.indexOf(b.label) || -1;
			return aIndex < bIndex ? -1 : aIndex > bIndex ? 1 : 0;
		});
	return { columns, errors, include };
};
