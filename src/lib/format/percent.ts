export const percent = (number: any, options: any = {}) => {
	options = Object.assign(
		{ minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'percent' },
		options
	);
	const { format } = new Intl.NumberFormat('en-us', options);
	return format(number);
};
