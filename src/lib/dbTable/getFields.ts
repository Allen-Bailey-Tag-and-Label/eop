export const getFields = (model) => {
	const fields = model?.fields;
	if (fields === undefined) throw 'Could not find fields';
	const fieldMap = fields.reduce((map, field) => {
		map.set(field.name, field);
		return map;
	}, new Map());
	return { fields, fieldMap };
};
