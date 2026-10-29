import type { DataValue, RuleOperator, SlideData, SlideVisibility, VisibilityRule } from './types';

const operators: RuleOperator[] = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains'];
const record = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid visibility rule.');
	return value as Record<string, unknown>;
};
const string = (value: unknown, max = 160) => {
	if (typeof value !== 'string' || !value.trim() || value.length > max)
		throw new Error('Enter a valid visibility rule value.');
	return value;
};
export function validateVisibility(input: unknown): SlideVisibility {
	const value = record(input);
	if (value.match !== 'all' && value.match !== 'any')
		throw new Error('Choose all or any visibility rules.');
	const timeZone = string(value.timeZone);
	try {
		new Intl.DateTimeFormat('en-US', { timeZone }).format();
	} catch {
		throw new Error('Choose a valid visibility time zone.');
	}
	if (!Array.isArray(value.rules) || !value.rules.length || value.rules.length > 20)
		throw new Error('Add between 1 and 20 visibility rules.');
	const rules = value.rules.map((raw): VisibilityRule => {
		const rule = record(raw);
		if (rule.kind === 'date') {
			const date = string(rule.value);
			if (
				!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
				!Number.isFinite(Date.parse(date)) ||
				new Date(date).toISOString().slice(0, 10) !== date
			)
				throw new Error('Choose a valid visibility date.');
			if (!['before', 'on-or-before', 'after', 'on-or-after'].includes(String(rule.operator)))
				throw new Error('Choose a date comparison.');
			return {
				kind: 'date',
				operator: rule.operator as 'before' | 'on-or-before' | 'after' | 'on-or-after',
				value: date
			};
		}
		if (rule.kind === 'weekdays') {
			if (
				!Array.isArray(rule.days) ||
				!rule.days.length ||
				rule.days.length > 7 ||
				rule.days.some((day) => !Number.isInteger(day) || day < 0 || day > 6)
			)
				throw new Error('Choose at least one weekday.');
			return { kind: 'weekdays', days: [...new Set(rule.days)] as number[] };
		}
		if (rule.kind === 'time') {
			if (
				![rule.start, rule.end].every(
					(time) => typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
				)
			)
				throw new Error('Choose valid start and end times.');
			return { kind: 'time', start: rule.start as string, end: rule.end as string };
		}
		if (rule.kind === 'dataCount' || rule.kind === 'dataValue') {
			const elementId = string(rule.elementId, 80),
				operator = rule.operator as RuleOperator,
				target = string(rule.value, 500);
			if (!operators.includes(operator)) throw new Error('Choose a data comparison.');
			if (
				rule.kind === 'dataCount' &&
				(operator === 'contains' || !/^\d+$/.test(target) || Number(target) > 100000)
			)
				throw new Error('Use a nonnegative whole number for data counts.');
			if (['gt', 'gte', 'lt', 'lte'].includes(operator) && !Number.isFinite(Number(target)))
				throw new Error('Use a number for this comparison.');
			return rule.kind === 'dataCount'
				? { kind: 'dataCount', elementId, operator, value: target }
				: { kind: 'dataValue', elementId, operator, value: target, field: string(rule.field) };
		}
		throw new Error('Choose a supported visibility rule.');
	});
	return { match: value.match, timeZone, rules };
}

function compare(actual: DataValue | undefined, operator: RuleOperator, target: string) {
	if (actual == null) return false;
	const equal =
		typeof actual === 'number' && Number.isFinite(Number(target))
			? actual === Number(target)
			: String(actual) === target;
	if (operator === 'eq') return equal;
	if (operator === 'neq') return !equal;
	if (operator === 'contains') return String(actual).includes(target);
	const a =
			typeof actual === 'number'
				? actual
				: typeof actual === 'string' && actual.trim()
					? Number(actual)
					: NaN,
		b = Number(target);
	if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
	return operator === 'gt'
		? a > b
		: operator === 'gte'
			? a >= b
			: operator === 'lt'
				? a < b
				: a <= b;
}

export function slideIsVisible(
	visibility: SlideVisibility | undefined,
	data: SlideData,
	now = new Date()
) {
	if (!visibility) return true;
	try {
		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone: visibility.timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			weekday: 'short',
			hour: '2-digit',
			minute: '2-digit',
			hourCycle: 'h23'
		}).formatToParts(now);
		const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
		const date = `${get('year')}-${get('month')}-${get('day')}`,
			time = `${get('hour')}:${get('minute')}`;
		const evaluate = (rule: VisibilityRule) => {
			if (rule.kind === 'date')
				return rule.operator === 'before'
					? date < rule.value
					: rule.operator === 'on-or-before'
						? date <= rule.value
						: rule.operator === 'after'
							? date > rule.value
							: date >= rule.value;
			if (rule.kind === 'weekdays')
				return rule.days.includes(
					['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
				);
			if (rule.kind === 'time')
				return (
					rule.start === rule.end ||
					(rule.start < rule.end
						? time >= rule.start && time < rule.end
						: time >= rule.start || time < rule.end)
				);
			const result = Object.hasOwn(data, rule.elementId) ? data[rule.elementId] : undefined;
			if (!result || result.state === 'error') return false;
			if (rule.kind === 'dataCount') return compare(result.items.length, rule.operator, rule.value);
			return result.items.some((row) =>
				compare(
					rule.field === 'label'
						? row.label
						: rule.field === 'detail'
							? row.detail
							: row.fields && Object.hasOwn(row.fields, rule.field.replace(/^row\./, ''))
								? row.fields[rule.field.replace(/^row\./, '')]
								: undefined,
					rule.operator,
					rule.value
				)
			);
		};
		return (
			visibility.rules.length > 0 &&
			(visibility.match === 'all'
				? visibility.rules.every(evaluate)
				: visibility.rules.some(evaluate))
		);
	} catch {
		return false;
	}
}
