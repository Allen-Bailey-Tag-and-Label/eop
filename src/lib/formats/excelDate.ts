const { format: dateFormat } = new Intl.DateTimeFormat('en-US', {
	month: 'numeric',
	day: 'numeric',
	year: 'numeric'
});
const { format: timeFormat } = new Intl.DateTimeFormat('en-US', {
	hour: 'numeric',
	minute: '2-digit',
	second: '2-digit',
	hour12: true
});

export const excelDate = (date: Date) => `${dateFormat(date)}  ${timeFormat(date)}`;
