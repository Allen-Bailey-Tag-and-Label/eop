export const dateTime = (date: Date | string) => {
	const { format } = new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		second: '2-digit',
		hour12: true
	});

	return format(typeof date === 'string' ? new Date(date) : date).replace(',', '');
};
