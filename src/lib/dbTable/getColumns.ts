import { Prisma } from '@prisma/client';
import { prisma } from '$lib/prisma';
import { filterFields } from './filterFields';
import { typeMap } from './typeMap';
import type { GetColumnsOptions, Error, Include } from './types';

export const getColumns = async (modelName: string, options: GetColumnsOptions) => {
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
		fields.map(async (field) => {
			const { isList, name, relationName, relationFromFields, relationToFields, type } = field;
			const { getLabel, ...column } = options.columnOverrides?.get(field.name) || {};
			column.key = name;
			column.label = name;
			column.type = typeMap.get(type);
			if (relationName !== undefined) {
				if (getLabel === undefined) {
					errors = [...errors, { key: name, error: 'Missing "getLabel" function' }];
					return;
				}
				const options = (await prisma[type].findMany())
					.map((row) => ({
						label: getLabel(row),
						value: row.id
					}))
					.sort((a, b) => a.label.localeCompare(b.label));
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
		.map(([_, field]) => field.dbTable);
	return { columns, errors, include };
};
