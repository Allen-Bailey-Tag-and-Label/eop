export const inputDateTimeLocal = (date: Date) => {
	if (!(date instanceof Date) || isNaN(date.getTime())) return '';
	const pad = (n: number) => String(n).padStart(2, '0');

	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
