export type CSV = string[][];
export type Header = string | { key: string; label: string };
export type Params = {
	data: Record<string, any>[];
	delimiter?: string;
	headers?: Header[];
	shouldShowHeaders?: boolean;
	shouldUseDataKeys?: boolean;
};

export const JSONtoCSV = (params: Params): string => {
	const defaultParams: Required<Omit<Params, 'data'>> = {
		delimiter: ',',
		headers: [],
		shouldShowHeaders: true,
		shouldUseDataKeys: true
	};

	params = Object.assign(defaultParams, params);
	const { data, delimiter, headers, shouldShowHeaders, shouldUseDataKeys } = params;

	let csv: CSV = [];

	const sanitizedHeaders = shouldUseDataKeys
		? Object.keys(data[0]).map((key) => ({ key, label: key }))
		: (headers || []).map((header) =>
				typeof header === 'string' ? { key: header, label: header } : header
			);

	if (shouldShowHeaders) {
		csv.push(sanitizedHeaders.map(({ label }) => formatCell(label)));
	}

	for (const rowData of data) {
		const row = sanitizedHeaders.map(({ key }) => formatCell(rowData[key]));
		csv.push(row);
	}

	return csv.map((row) => row.join(delimiter)).join('\n');
};

const formatCell = (cell: any) => {
	let value = cell;
	if (typeof value === 'boolean') value = value ? 'true' : 'false';
	if (typeof value === 'number') value = value.toString();
	if (Array.isArray(value)) value = value.join(',');
	return `"${value.replace('"', '""').replace('\\', '\\\\')}"`;
};
