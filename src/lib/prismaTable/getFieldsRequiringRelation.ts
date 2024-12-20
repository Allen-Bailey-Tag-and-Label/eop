export const getFieldsRequiringRelation = (fields: any) =>
	fields
		.filter(({ relationName }) => relationName !== undefined)
		.reduce((map, { isList, name, type }) => {
			map.set(`${isList ? name.slice(0, -1) : name}Id${isList ? 's' : ''}`, {
				key: name,
				model: type
			});
			return map;
		}, new Map<string, { key: string; model: string }>());
