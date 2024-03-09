import { prisma } from '$lib/prisma';
import { filterFields } from './filterFields';
import { typeMap } from './typeMap';
import type { Column, Error, Include, ModelName, Options } from './types';

const getLabel = (name: string) =>
	name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');

export const getColumns = async (options: Options) => {
	let errors: Error[] = [];
	const include: Include = {};
	if (options.fields === undefined) return;
	await Promise.all(
		options.fields
			.filter((field) => !options.filteredColumns.includes(field.name))
			.map(async (field) => {
				const { isList, name, relationName, relationFromFields, relationToFields, type } = field;
				const { getRelationLabel, ...column }: Column = options?.columns?.get(field.name) || {};
				column.key = column.key || name;
				column.label = column.label || getLabel(name);
				column.type = column.type || typeMap.get(type);
				if (relationName !== undefined) {
					if (getRelationLabel === undefined) {
						errors = [...errors, { key: name, error: 'Missing "getRelationLabel" function' }];
						return;
					}
					const columnOptions = (await prisma[type as ModelName].findMany())
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
						const relationshipField = options?.fieldMap?.get(relationshipFieldName) || {};
						relationshipField.dbTable = {
							...relationshipField?.dbTable,
							label: getLabel(name),
							options: columnOptions,
							type: relationshipType
						};
						options.fieldMap.set(relationshipFieldName, relationshipField);
					}
				}
				options.fieldMap.set(name, { ...options.fieldMap.get(name), dbTable: column });
			})
	);
	const columns = Array.from(options.fieldMap)
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
