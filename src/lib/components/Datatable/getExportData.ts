import { currency, excelDate } from '$lib/formats';
import { getAt } from './';
import type { ColumnSanitized, RowSanitized } from './types';

export const getExportData = ({
	columnsSanitized,
	rows
}: {
	columnsSanitized: (Partial<Omit<ColumnSanitized, 'isExportable' | 'key' | 'options' | 'type'>> &
		Required<Pick<ColumnSanitized, 'isExportable' | 'key' | 'options' | 'type'>>)[];
	rows: RowSanitized[];
}) =>
	rows.map((row) =>
		columnsSanitized
			.filter(({ isExportable }) => isExportable)
			.map(({ key, options, type, valueFn }) => {
				let value = getAt(row.row, key);

				if (type === 'boolean') return value ? 'TRUE' : 'FALSE';
				if (type === 'currency') return currency(value);
				if (type === 'function' && valueFn) return valueFn({ key, object: row.row });
				if (type === 'multiSelect' && Array.isArray(options) && Array.isArray(value))
					return value
						.map((v: any) => options.find((option) => option.value === v)?.label ?? v)
						.join(', ');
				if (type === 'select' && Array.isArray(options))
					return options.find((option) => option.value === value)?.label ?? value ?? '';
				if (type === 'timestamp') {
					const date = value instanceof Date ? value : new Date(value);
					return isNaN(date.getTime()) ? '' : excelDate(date);
				}

				if (value === null || value === undefined) return '';
				if (typeof value === 'object') return JSON.stringify(value);

				return String(value);
			})
	);
