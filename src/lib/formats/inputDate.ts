export const inputDate = (date: Date | string) => {
	if (typeof date === 'string') date = new Date(date);
	if (!(date instanceof Date) || isNaN(date.getTime())) return '';
	return date.toISOString().substring(0, 10);
};
