export const integer = (number: any, options: any = {}) => {
	options = Object.assign({ maximumFractionDigits: 0 }, options);
	const { format } = new Intl.NumberFormat('en-us', options);
	return format(number);
};
