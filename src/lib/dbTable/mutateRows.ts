import { DateTime } from 'luxon';

export const mutateRows = async (
	columns: { key: string; type: string }[],
	rows: { [key: string]: any }[]
) => {
	const dateTimeColumns = [...columns].filter((column) => column.type === 'dateTime');
	if (dateTimeColumns.length > 0) {
		rows = rows.map((row) => {
			dateTimeColumns.forEach((column) => {
				row[column.key] = DateTime.fromJSDate(row[column.key]).toFormat("yyyy-MM-dd'T'HH:mm");
			});
			return row;
		});
	}
	return rows;
};
