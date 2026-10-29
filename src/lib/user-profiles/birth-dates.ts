export function isoBirthDate(value: unknown): string {
	if (value == null || value === '') return '';
	const date = value instanceof Date ? value : new Date(String(value));
	return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : '';
}
