import { Holiday } from '../mongoose/models/Holiday';
import type {
	DataListResult,
	SlideData,
	SlideDataSource,
	SlideDefinition
} from '$lib/slides/types';
import { validateDataSource } from '$lib/slides/validation';

function localDay(now: Date, timeZone: string) {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(now);
	const part = (type: string) => parts.find((item) => item.type === type)!.value;
	return `${part('year')}-${part('month')}-${part('day')}`;
}

async function upcomingHolidays(config: SlideDataSource, now: Date): Promise<DataListResult> {
	const today = localDay(now, config.timeZone);
	const start = new Date(`${today}T00:00:00Z`);
	const end = new Date(start);
	end.setUTCDate(end.getUTCDate() + config.daysAhead);
	const endDay = end.toISOString().slice(0, 10);
	const day = { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: config.timeZone } };
	const rows = await Holiday.find({
		// Broad indexed bounds plus exact business-calendar days handle midnight and DST.
		date: { $gte: new Date(start.getTime() - 86400000), $lt: new Date(end.getTime() + 86400000) },
		$expr: { $and: [{ $gte: [day, today] }, { $lt: [day, endDay] }] }
	})
		.select('date name')
		.sort({ date: 1, _id: 1 })
		.limit(config.limit)
		.maxTimeMS(4000)
		.lean();
	const dateFormat = new Intl.DateTimeFormat('en-US', {
		timeZone: config.timeZone,
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
	return {
		state: rows.length ? 'ready' : 'empty',
		items: rows.map((row) => ({
			id: row._id.toString(),
			label:
				typeof row.name === 'string' && row.name.trim() ? row.name.trim().slice(0, 160) : 'Holiday',
			detail: dateFormat.format(new Date(row.date))
		})),
		message: rows.length
			? ''
			: `No upcoming holidays in the next ${config.daysAhead} ${config.daysAhead === 1 ? 'day' : 'days'}.`
	};
}

// Only named server-owned providers can query persistence; slides never contain database queries.
const providers = { 'upcoming-holidays': upcomingHolidays };

export function createSlideDataResolver(now = new Date()) {
	// Share identical queries within this response only. Every render request reads fresh data.
	const pending = new Map<string, Promise<DataListResult>>();
	return async (definition: SlideDefinition): Promise<SlideData> =>
		Object.fromEntries(
			await Promise.all(
				definition.elements
					.filter((element) => element.type === 'list')
					.map(async (element) => {
						let result: DataListResult;
						try {
							const config = validateDataSource(element.dataSource);
							const key = JSON.stringify(config);
							if (!pending.has(key)) pending.set(key, providers[config.source](config, now));
							result = await pending.get(key)!;
						} catch (cause) {
							console.error('Unable to load slide data source', cause);
							result = {
								state: 'error',
								items: [],
								message: 'Holiday data is temporarily unavailable.'
							};
						}
						return [element.id, result];
					})
			)
		);
}
