type Options = {
	minimumFractionDigits?: number;
};

export const currency = (value: number, options: Options = { minimumFractionDigits: 2 }) => {
	const { format } = new Intl.NumberFormat('en-US', {
		currency: 'USD',
		minimumFractionDigits: options?.minimumFractionDigits ?? 2,
		style: 'currency'
	});
	return format(value);
};
