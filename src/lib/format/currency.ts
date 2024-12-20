export const currency = (number: any, options: any = {}) => {
	options = Object.assign({ currency: 'USD', style: 'currency' }, options);
	const { format } = new Intl.NumberFormat('en-us', options);
	return format(number);
};
