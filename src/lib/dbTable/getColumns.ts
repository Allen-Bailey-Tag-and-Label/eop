import { Prisma } from '@prisma/client';
import { prisma } from '$lib/prisma';
import { filterFields } from './filterFields';
import { typeMap } from './typeMap';
import type { GetColumnsOptions, Error, FindManyParamaters } from './types';

export const getColumns = async (modelName: string, options: GetColumnsOptions) => {
	const defaultOptions = {
		columnOverrides: new Map(),
		fieldFilterNames: []
	};
	options = Object.assign(defaultOptions, options);
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
	let findManyParamaters: FindManyParamaters = { include: {} };
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
				const options = (await prisma[type].findMany()).map((row) => ({
					label: getLabel(row),
					value: row.id
				}));
				// one-to-one
				if (!isList && relationFromFields !== undefined && relationFromFields.length === 0) {
					column.options = options;
					column.type = 'one-to-one';
				}
				// one-to-many
				if (isList && relationFromFields !== undefined && relationFromFields.length === 0) {
					column.options = options;
					column.type = 'one-to-many';
				}
				// many-to-many
				if (
					relationFromFields !== undefined &&
					relationFromFields?.length !== 0 &&
					relationToFields?.length !== 0
				) {
					const relationshipFieldName = relationFromFields[0];
					const relationshipField = fieldMap.get(relationshipFieldName);
					const relationshipType = 'many-to-many';
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
	return { columns, errors, findManyParamaters };
};
