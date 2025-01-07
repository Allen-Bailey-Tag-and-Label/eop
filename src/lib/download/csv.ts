import { DateTime } from 'luxon';
import { JSONtoCSV } from '$lib/format';
import type { Params as JSONtoCSVParams } from '$lib/format/JSONtoCSV';

type Params = JSONtoCSVParams & { fileName: string; shouldAddTimestamp?: boolean };

export const csv = ({ data, fileName, shouldAddTimestamp, ...options }: Params) => {
	shouldAddTimestamp = shouldAddTimestamp === undefined ? true : shouldAddTimestamp;
	const csvText = JSONtoCSV({ data, ...options });

	const hiddenElement = window.document.createElement('a');
	hiddenElement.href = `data:text/csv;charset=utf-8,${encodeURI(csvText)}`;
	hiddenElement.target = '_blank';
	hiddenElement.download = `${fileName}${shouldAddTimestamp ? DateTime.fromJSDate(new Date(), { zone: 'America/New_York' }).toMillis() : ''}.csv`;
	hiddenElement.click();
	hiddenElement.remove();
};
